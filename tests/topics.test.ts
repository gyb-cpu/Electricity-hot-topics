// Topic pages: which articles a topic takes, and their counts.
// Written before the code, from the ways it can go wrong:
// - a company topic takes an article about another company that only mentions it (several subjects,
//   its name nowhere in the title), or drops one about it whose title names it in English, in another
//   case, next to Chinese text, or only by an official name (it is the article's only subject);
// - a Latin name matches inside another word ("Spice" is not SPIC); a headline naming a company
//   that is not a subject of the article gets in;
// - a technical-direction topic stops taking its tags;
// - withdrawn or not yet released articles appear in a list or a count;
// - an article or story page names a topic its reports do not belong to;
// - a topic without content has no page, or an unknown slug or a page past the end has one.
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@powerhot/backend/db";
import { upsertMaterial } from "@powerhot/backend/content/materials";
import { stopBoss } from "@powerhot/backend/jobs/queue";
import { publishArticle } from "@powerhot/backend/publication/publish";
import { TOPICS, loadTopicPage, listTopicSummaries, topicsOfStory } from "@powerhot/backend/publication/topics";
import { buildApp } from "../apps/api/src/app.ts";

const T = tag();
const OFFICIAL = `test-topics-official-${T}`;
const MEDIA = `test-topics-media-${T}`;
const app = await buildApp();

before(async () => {
  await sql`INSERT INTO sources (id, name, kind, tier, participation_mode, first_party, next_fetch_at) VALUES
    (${OFFICIAL}, 'Official', 'rss', 'T1', 'editorial', true, '2100-01-01'),
    (${MEDIA}, 'Media', 'rss', 'T2', 'editorial', false, '2100-01-01')`;
});
after(async () => {
  await app.close();
  await stopBoss();
  await closeDb();
});

let n = 0;
interface Report {
  source?: string;
  at: Date;
  title: string;
  originalTitle?: string;
  subjects?: string[];
  tags?: string[];
  score?: number;
  selected?: boolean;
  fact?: number;
  category?: string;
}

/** The classification tag that goes with a category, so the topic and the category say the same thing. */
const categoryTag: Record<string, string> = {
  policy: "政策发布", market: "市场交易", grid: "项目建设", coal: "项目建设", hydro: "项目建设",
  nuclear: "项目建设", wind: "项目建设", solar: "项目建设", storage: "项目建设",
  data: "数据发布", industry: "行业动态", opinion: "观点评论",
};

/** A published report; `fact` links it to a fact before publishing, as grouping would. */
async function report(r: Report): Promise<string> {
  n += 1;
  const { articleId } = await upsertMaterial({
    sourceId: r.source ?? MEDIA, url: `https://example.com/topics-${T}-${n}`, title: r.originalTitle ?? r.title, bodyText: "body", bodyHtml: "<p>body</p>", bodyStatus: "ok", via: "fetch", publishedAt: r.at,
  });
  await sql`UPDATE articles SET discovered_at = ${r.at}, timeline_at = ${r.at}, grouped_at = now() WHERE id = ${articleId}`;
  await sql`INSERT INTO analyses (article_id, input_revision, origin, relevance, category, title_zh, summary_zh, score, selected, subjects, tags)
            VALUES (${articleId}, 1, 'rule', 'pass', ${r.category ?? "policy"}, ${r.title}, ${`摘要 ${n}`}, ${r.score ?? 80}, ${r.selected ?? true}, ${r.subjects ?? []}, ${[categoryTag[r.category ?? "policy"], ...(r.tags ?? [])]})`;
  if (r.fact) await sql`INSERT INTO fact_articles (fact_id, article_id, role) VALUES (${r.fact}, ${articleId}, 'report')`;
  await publishArticle(articleId, { releasedAt: new Date(r.at.getTime() + 60_000) });
  return articleId;
}

async function story(title: string): Promise<{ id: number; publicId: string }> {
  const publicId = randomUUID();
  const [s] = await sql<{ id: number }[]>`INSERT INTO stories (public_id, title, first_report_at, latest_at) VALUES (${publicId}, ${title}, now(), now()) RETURNING id`;
  return { id: s!.id, publicId };
}

async function fact(storyId: number | null, title: string): Promise<number> {
  const [f] = await sql<{ id: number }[]>`INSERT INTO facts (public_id, story_id, title) VALUES (${`f-${T}-${randomUUID()}`}, ${storyId}, ${title}) RETURNING id`;
  return f!.id;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const ids = (items: Array<{ id: string }>) => items.map((i) => i.id);
const page = async (slug: string, p = 1) => {
  const data = await loadTopicPage(slug, p, new Date());
  assert.ok(data, `${slug} page ${p}`);
  return data;
};
/** Every article of a topic, over all its pages. */
async function members(slug: string): Promise<string[]> {
  const first = await page(slug);
  const out = ids(first.items);
  for (let p = 2; p <= first.pageCount; p++) out.push(...ids((await page(slug, p)).items));
  return out;
}

test("a company topic takes the articles about it, not the ones that only mention it", async () => {
  const about = await report({ at: hoursAgo(30), title: `国家能源局印发并网运行管理规定 ${T}`, subjects: ["nea"] });
  const project = await report({ at: hoursAgo(31), title: `华能 1 号机组并网 ${T}`, subjects: ["huaneng"] });
  const english = await report({ at: hoursAgo(32), title: `新规发布 ${T}`, originalTitle: `NEA issues a new grid operation rule ${T}`, subjects: ["nea", "sgcc"] });
  const mentions = await report({ at: hoursAgo(33), title: `能源监管办通报事故并点名国家电网 ${T}`, subjects: ["sgcc", "nea", "csg"] });
  const lowerCase = await report({ at: hoursAgo(34), title: `nea 公布新的安全框架 ${T}`, subjects: ["nea", "sgcc"] });
  const pact = await report({ at: hoursAgo(35), title: `多家电力企业签署消纳责任协议 ${T}`, subjects: ["nea", "sgcc", "cec"] });
  const spice = await report({ at: hoursAgo(36), title: `Spice prices surge as the season warms ${T}`, subjects: ["spic", "sgcc"] });
  const adjacent = await report({ at: hoursAgo(37), title: `发布SPIC的新机组 ${T}`, subjects: ["spic", "sgcc"] });
  const headline = await report({ at: hoursAgo(38), title: `国家能源局被一篇盘点提到 ${T}`, subjects: ["csg"] });
  const uhv = await report({ at: hoursAgo(39), title: `特高压通道开工 ${T}`, category: "grid", tags: ["特高压"] });
  const regulator = await report({ at: hoursAgo(40), title: `华北能源监管局通报执法情况 ${T}`, subjects: ["energy-regulators"] });
  const regulatorFromNea = await report({ at: hoursAgo(41), title: `能源局发文部署保供 ${T}`, subjects: ["nea"] });

  const nea = await members("nea");
  for (const id of [about, english, lowerCase, regulatorFromNea]) assert.ok(nea.includes(id), "about 国家能源局");
  for (const id of [mentions, pact, headline, regulator]) assert.ok(!nea.includes(id), "only mentions 国家能源局");
  const sgcc = await members("sgcc");
  for (const id of [mentions]) assert.ok(sgcc.includes(id), "about 国家电网");
  for (const id of [english, lowerCase, pact]) assert.ok(!sgcc.includes(id), "only mentions 国家电网");
  const spic = await members("spic");
  assert.ok(spic.includes(adjacent), "SPIC next to Chinese text");
  assert.ok(!spic.includes(spice), "Spice is not SPIC");
  assert.ok((await members("uhv")).includes(uhv), "a technical direction takes its tag");
  assert.ok(!nea.includes(project), "another company's project");
  // The regulators are the NEA's 派出机构 but their own bodies: neither topic page swallows the other.
  const regulators = await members("energy-regulators");
  assert.ok(regulators.includes(regulator), "about 能源监管局");
  assert.ok(!regulators.includes(regulatorFromNea), "a 本级发文 is not a regulator report");

  // The article page names the topics it belongs to.
  const topicsOf = async (id: string) => {
    const res = await app.inject({ method: "GET", url: `/api/site/items/${id}` });
    return (JSON.parse(res.body) as { topics: Array<{ slug: string }> }).topics.map((t) => t.slug);
  };
  assert.deepEqual(await topicsOf(about), ["nea", "policy-release"]);
  assert.deepEqual(await topicsOf(mentions), ["sgcc", "policy-release"]);
  assert.deepEqual(await topicsOf(pact), ["policy-release"]);
  assert.deepEqual(await topicsOf(uhv), ["uhv", "projects"]);
});

test("a story page names the topics of its reports", async () => {
  const launch = await story(`特高压工程 V2 开工 ${T}`);
  await report({ source: OFFICIAL, at: hoursAgo(26), title: `特高压工程 V2 开工 ${T}`, category: "grid", tags: ["特高压"], fact: await fact(launch.id, "开工 V2") });
  assert.deepEqual(await topicsOfStory(launch.id), [{ slug: "uhv", name: "特高压" }, { slug: "projects", name: "项目建设" }]);
});

test("withdrawn articles stay out of lists and counts", async () => {
  const kept = await report({ at: hoursAgo(5), title: `三峡集团新机组核准 ${T}`, category: "hydro", subjects: ["three-gorges"], tags: ["储能"] });
  const withdrawn = await report({ at: hoursAgo(4), title: `三峡集团撤回的消息 ${T}`, category: "hydro", subjects: ["three-gorges"], tags: ["储能"] });
  await sql`UPDATE publications SET visibility = 'withdrawn' WHERE article_id = ${withdrawn}`;

  const data = await page("three-gorges");
  assert.deepEqual(ids(data.items), [kept]);
  assert.equal(data.topic.total, 1);
  const summary = (await listTopicSummaries()).topics.find((t) => t.slug === "three-gorges")!;
  assert.equal(summary.latest?.title, `三峡集团新机组核准 ${T}`, "the index shows the newest public article");
});

test("every topic has a page; unknown topics and pages past the end have none", async () => {
  const empty = await page("cgn");
  assert.equal(empty.topic.indexable, false, "a topic without content is not indexed");
  assert.deepEqual(empty.items, []);
  assert.equal(await loadTopicPage("not-a-topic", 1, new Date()), null);
  assert.equal(await loadTopicPage("cgn", 2, new Date()), null);
  const index = await app.inject({ method: "GET", url: "/api/site/topics" });
  const body = JSON.parse(index.body) as { groups: Array<{ key: string }>; topics: Array<{ slug: string }> };
  assert.deepEqual(body.groups.map((g) => g.key), ["company", "field", "genre"]);
  assert.deepEqual(body.topics.map((t) => t.slug).sort(), TOPICS.map((t) => t.slug).sort(), "the index lists every topic");
});
