// 把 site/public/openapi-v1.json 转成 Mintlify 用的 openapi.json：
//   1. 替换 {{占位符}}；
//   2. 给每个端点补上中文标题和一句中文说明（主工程那份定义是英文的）。
// 主工程的那份文件不动，这里只改文档站用的副本。
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../../site/public/openapi-v1.json", import.meta.url);
const dest = new URL("../openapi.json", import.meta.url);

const placeholders = {
  "{{siteName}}": "电力热点宝",
  "{{siteUrl}}": "https://powerhot.example.com",
  "{{version}}": "4.0.0",
  "{{dailyTime}}": "08:00",
  "{{weeklyTime}}": "10:00",
  "{{monthlyTime}}": "10:30",
  "{{categories}}": "category",
  "{{categoryList}}":
    "政策、市场、电网、煤电、水电、核电、风电、光伏、储能、数据、行业、观点",
};

/**
 * 按 operationId 写的中文标题。Mintlify 用 `summary` 当接口页的标题，
 * 少了这张表，侧边栏里就是 List recent public items 这类英文。
 * 新增端点时在这里加一行；漏了不会报错，只是那一页标题还是英文。
 */
const titles = {
  items: "最近的公开条目",
  hotTopics: "当前的多来源热点",
  storyByPublicId: "事件详情：报道时间线与综述",
  dailies: "日报归档索引",
  latestDaily: "最新一期日报",
  dailyByDate: "按上海日期取日报",
  weeklies: "周报索引",
  latestWeekly: "最新一期周报",
  weeklyByWeek: "按 ISO 周取周报",
  monthlies: "月报索引",
  latestMonthly: "最新一期月报",
  monthlyByMonth: "按月份取月报",
  selectedSnapshot: "精选快照（分页拉取）",
  selectedChanges: "精选变更（增量拉取）",
  agentGuide: "给 Agent 的接入说明",
  agentLatest: "最新条目（Agent 版）",
  agentSearch: "搜索（Agent 版）",
  agentHot: "当前热点（Agent 版）",
  agentStory: "事件时间线（Agent 版）",
  agentLatestDaily: "最新日报（Agent 版）",
  agentDaily: "指定日期的日报（Agent 版）",
  agentWeekly: "最新周报（Agent 版）",
  agentWeeklyByWeek: "指定周的周报（Agent 版）",
  agentMonthly: "最新月报（Agent 版）",
  agentMonthlyByMonth: "指定月份的月报（Agent 版）",
} as Record<string, string>;

/**
 * 网址。Mintlify 默认拿 `summary` 拼网址，中文标题会变成一串百分号编码，
 * 所以这里用 `x-mint.href` 钉住英文 slug；`sidebarTitle` 抵掉它按 slug 生成的英文标题。
 */
const slugs = {
  items: "recent-items",
  hotTopics: "hot-topics",
  storyByPublicId: "story",
  dailies: "dailies",
  latestDaily: "latest-daily",
  dailyByDate: "daily-by-date",
  weeklies: "weeklies",
  latestWeekly: "latest-weekly",
  weeklyByWeek: "weekly-by-week",
  monthlies: "monthlies",
  latestMonthly: "latest-monthly",
  monthlyByMonth: "monthly-by-month",
  selectedSnapshot: "selected-snapshot",
  selectedChanges: "selected-changes",
  agentGuide: "agent-guide",
  agentLatest: "agent-latest",
  agentSearch: "agent-search",
  agentHot: "agent-hot",
  agentStory: "agent-story",
  agentLatestDaily: "agent-latest-daily",
  agentDaily: "agent-daily",
  agentWeekly: "agent-latest-weekly",
  agentWeeklyByWeek: "agent-weekly-by-week",
  agentMonthly: "agent-latest-monthly",
  agentMonthlyByMonth: "agent-monthly-by-month",
} as Record<string, string>;

/** 一句中文说明，写在英文原文前面。方法返回 undefined 就不加。 */
const leads = {
  items: "按时间倒序返回最近 7 天的公开条目。跟进新条目时只往回翻页到已有的 id。",
  hotTopics: "按独立来源数量和讨论热度排的当前热点前 10 名。",
  storyByPublicId: "一个事件下的全部报道、事件综述和溯源信息。",
  dailies: "已出刊日报的索引，最新在前。",
  latestDaily: "最新一期的日报。",
  dailyByDate: "按上海时区的日历日期取当天的日报。",
  weeklies: "已出刊周报的索引，最新在前。",
  latestWeekly: "最新一期的周报。",
  weeklyByWeek: "按 ISO 周取那一周的周报。",
  monthlies: "已出刊月报的索引，最新在前。",
  latestMonthly: "最新一期的月报。",
  monthlyByMonth: "按月份取那个月的月报。",
  selectedSnapshot: "把当前精选完整拉一遍，之后只读 changes 保持同步。",
  selectedChanges: "自上次游标以来的精选增删改，按顺序返回。",
  agentGuide: "一份 Markdown 索引，列出所有给 Agent 用的地址，从这里开始。",
  agentLatest: "与 /api/v1/items 相同的数据，渲染成方便转述的 Markdown。",
  agentSearch: "按关键词搜索标题和摘要，返回 Markdown。",
  agentHot: "与 /api/v1/hot-topics 相同的数据，渲染成 Markdown。",
  agentStory: "一个事件的报道时间线，渲染成 Markdown。",
  agentLatestDaily: "最新一期日报，渲染成 Markdown。",
  agentDaily: "指定日期的日报，渲染成 Markdown。",
  agentWeekly: "最新一期周报，渲染成 Markdown。",
  agentWeeklyByWeek: "指定周的周报，渲染成 Markdown。",
  agentMonthly: "最新一期月报，渲染成 Markdown。",
  agentMonthlyByMonth: "指定月份的月报，渲染成 Markdown。",
} as Record<string, string | undefined>;

let out = readFileSync(src, "utf8");
for (const [k, v] of Object.entries(placeholders)) out = out.split(k).join(v);

const spec = JSON.parse(out);
const missing: string[] = [];
let localized = 0;

for (const item of Object.values(spec.paths)) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const op = item[method];
    if (!op) continue;
    const id = op.operationId as string;
    if (!titles[id] || !slugs[id]) missing.push(id);
    if (titles[id]) {
      op.summary = titles[id];
      localized += 1;
    }
    // 分组名取自 tag；没有 tag 时 Mintlify 会用写死的 "API Reference"。
    op.tags = ["端点"];
    if (slugs[id]) {
      op["x-mint"] = {
        href: `/api-reference/${slugs[id]}`,
        metadata: { sidebarTitle: titles[id] ?? slugs[id] },
      };
    }
    if (leads[id] && typeof op.description === "string") {
      op.description = `${leads[id]}\n\n${op.description}`;
    }
  }
}
if (missing.length) console.warn(`没有中文标题的端点: ${missing.join(", ")}`);

writeFileSync(dest, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

const left = out.match(/\{\{[a-zA-Z]+\}\}/g) ?? [];
console.log(`占位符剩余: ${left.length ? left.join(", ") : "无"}`);
console.log(`端点数: ${localized}/${Object.keys(titles).length} 已中文化`);