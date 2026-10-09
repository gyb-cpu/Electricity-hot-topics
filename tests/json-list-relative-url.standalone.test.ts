// A CMS 列表给的链接常常是相对自己的目录的（能源局就是 "../2026…/c.html"）。这类链接要能直接用：
// 按抓列表用的那个 URL 解析出来，不必在信源里逐条拼绝对地址。
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";
import { config } from "@powerhot/backend/config";
import { fetchJsonList } from "@powerhot/backend/sources/json-list";
import type { SourceRow } from "@powerhot/backend/sources/types";

const routes = new Map<string, unknown>();
const server = http.createServer((req, res) => {
  const body = routes.get(new URL(req.url ?? "/", "http://fixture").pathname);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body ?? []));
});
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
const saved = config.allowPrivateNetworkFetch;
config.allowPrivateNetworkFetch = true;
after(async () => {
  config.allowPrivateNetworkFetch = saved;
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

function source(url: string): SourceRow {
  return { id: `rel-${tag()}`, name: "相对链接", kind: "json_list", tier: "T1", participation_mode: "editorial", first_party: false, interval_minutes: 60, enabled: true, cursor: null, fail_count: 0, config: { url, itemsPath: "datasource", titlePaths: ["showTitle"], urlTemplate: "{raw:publishUrl}", publishedAtPath: "publishTime", publishedAtUtcOffset: "+08:00" } };
}

test("a listing link written back into its own tree resolves against the listing url", async () => {
  routes.set("/policy/ds_1.json", { datasource: [
    { showTitle: "相对链接的条目", publishUrl: "../20260930/abc/c.html", publishTime: "2026-09-30 17:48:36" },
    { showTitle: "同目录的条目", publishUrl: "list/2.htm", publishTime: "2026-09-29 10:00:00" },
    { showTitle: "根目录的条目", publishUrl: "/20260101/xyz/c.html", publishTime: "2026-09-28 10:00:00" },
  ] });
  const got = await fetchJsonList(source(`${base}/policy/ds_1.json`));
  assert.deepEqual(got.map((c) => c.url), [
    `${base}/20260930/abc/c.html`,
    `${base}/policy/list/2.htm`,
    `${base}/20260101/xyz/c.html`,
  ]);
});

test("an absolute link in the same listing is left as it is", async () => {
  routes.set("/news/ds_2.json", { datasource: [
    { showTitle: "绝对链接的条目", publishUrl: "https://www.nea.gov.cn/20260929/def/c.html", publishTime: "2026-09-29 15:14:39" },
  ] });
  const got = await fetchJsonList(source(`${base}/news/ds_2.json`));
  assert.deepEqual(got.map((c) => c.url), ["https://www.nea.gov.cn/20260929/def/c.html"]);
});

test("a title stored as markup comes out as its text, and the date keeps the source's offset", async () => {
  routes.set("/policy/ds_3.json", { datasource: [
    { showTitle: "<a href='http://www.nea.gov.cn/x/c.html'>关于印发某办法的通知</a>", publishUrl: "../20260922/ghi/c.html", publishTime: "2026-09-22 11:35:53" },
  ] });
  const [c] = await fetchJsonList(source(`${base}/policy/ds_3.json`));
  assert.equal(c!.title, "关于印发某办法的通知");
  assert.equal(c!.publishedAt?.toISOString(), "2026-09-22T03:35:53.000Z");
});