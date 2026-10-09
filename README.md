<h1 align="center">电力热点宝</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-176b75?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Node.js-24-176b75?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24">
  <img src="https://img.shields.io/badge/PostgreSQL-17-176b75?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 17">
  <img src="https://img.shields.io/badge/Docker-Compose-176b75?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p align="center">
  <b>盯住电力行业的政策发布与市场动态，每天早上出一份日报。</b><br>
  官方发文一进来就归类、评分、写摘要，同一件事的多篇报道并成一个事件。
</p>

<p align="center">
  <a href="#跑起来">跑起来</a> ·
  <a href="#行业知识在哪里">行业知识在哪里</a> ·
  <a href="#它是怎么工作的">它是怎么工作的</a> ·
  <a href="#文档">文档</a>
</p>

<br>

## 这是什么

**电力热点宝** 是一个电力行业的热点站：每天从国家发展改革委、国家能源局、中国政府网、各能源监管机构和省级发改部门的公开发布栏目收资料，用模型预筛、独立打两次分，挑出真正值得看的，写成中文标题、摘要和推荐理由；把不同来源对同一件事的报道并成一个事件；每天早上 08:00 出一份日报，周报和月报从日报里汇编。

它是**聚合与摘要工具，不是政策发布机关**。站内不转载政策原文，只给摘要和原文链接；一切以发布机关官网的正式文本为准。使用规则见站内[使用规则](/terms)。

关注范围以官方一手为主：政策文件与征求意见稿、电价与市场规则、电网与各能源品种的项目进展、电力运行数据、监管执法与事故调查。

## 这个仓库里有什么

网站、后台、精选流程、事件聚簇和热度算法，加上**这个电力行业站的全部知识**：分类、标签、主题目录、信源、每一步的提示词原文、入选门槛。这些都在 [`site/`](site/) 和 [`industry/`](industry/) 两个文件夹里，不需要改 `apps/` 和 `packages/` 里的代码。

## 跑起来

需要 [Docker](https://docs.docker.com/get-started/get-docker/)、[Node.js 24](https://nodejs.org/en/download)（运行 `init-env` 生成配置要用），和一个 OpenAI 兼容的模型 API Key。

```bash
node scripts/init-env.ts --llm-key <你的模型 API Key>
docker compose up -d --build
```

打开 <http://localhost:3000>。后台在 `/admin`，管理员密码在 `.env` 的 `ADMIN_PASSWORD` 里。

**国家能源局、中国政府网和能源监管局的栏目页是前端渲染的**，HTML 里没有条目。但它们要渲染的数据本身就是一个可直连的 JSON（能源局是栏目页同目录的 `ds_*.json`，中国政府网是 `ZUIXINZHENGCE.json`），直接抓那个 JSON 就行，不需要 Jina Reader，也不需要额外配置。发改委与部分省级门户是服务端渲染，用 CSS 选择器抓。

改完信源后到后台“信源”页对每个信源点一次“预览抓取”，核对条目和日期；能源局的 `ds_*.json` 文件名是该站 CMS 的数据源 id，改版会变，取法写在 `industry/sources.json` 的 `$nea_json` 注释里。详见 [信源](docs/sources.md)。

安全阀默认关：`COLLECT_ENABLED`、`MODEL_CALLS_ENABLED` 只有写成 `true` 才开始采集和调用模型。不跑 Docker、直接在 Linux 或 macOS 上运行时用 WSL2，见 [部署](docs/deploy.md)。

站点跑起来后，`/agent` 里有 MCP、RSS 和 API 的接入方式；只能读网页的 Agent 从 `/api/v1/agent` 开始；接口说明在 `/openapi-v1.json`。

## 行业知识在哪里

| 文件 | 内容 |
|---|---|
| `industry/taxonomy.ts` | 12 个类别（政策、市场、电网、煤电、水电、核电、风电、光伏、储能、数据、行业、观点）、标签词表、机构与企业名录、日报报头数的那类发布 |
| `industry/topics.json` | 主题目录（`/topics`）：机构与企业、业务方向、内容形态共 36 个 |
| `industry/sources.json` | 首次启动时导入的示范信源（以官方一手为主） |
| `industry/prompts/` | 预筛、评分、写作、结构化、归组、事件综述、周报月报、翻译。**这个行业的判断标准就写在这里** |
| `industry/selection.ts` | 入选门槛 |
| `site/site.ts` | 站名、出刊时间、首页文案、关于页、日报周报月报上的说法 |
| `site/pages/` | 使用规则与隐私说明 |
| `site/brand/` | 图标、Logo、日报报头字 |
| `site/changelog.json` | 更新日志 |

**最值得花时间的是评分标准**（`industry/prompts/selection-score.md`）：它写着"什么样的电力消息算重要、什么样的算噪声"。门槛（`industry/selection.ts`）现在还是别的行业校准出来的数字，要用自己的样本重跑一遍 `scripts/eval-selection.ts` 再上线，做法在 [精选与校准](docs/selection.md)。

改行业知识的顺序和字段含义见 [把它改成你的行业](docs/customize.md)。

## 它是怎么工作的

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/how-dark.png">
  <img src="docs/assets/how-light.png" alt="六步：采集、预筛、两次评分、写作、聚簇、热点与成刊" width="100%">
</picture>

一条资料从信源进来，先判重，再预筛；可能重要的独立打两次分，写好中文标题和摘要，和别的报道聚成事件，算进热度。分数过了门槛、又不是精选里已有新闻的重复，才进精选；日报按规则编出当天要闻，周报、月报再从日报里汇编。每一步的提示词都在 [`industry/prompts/`](industry/prompts/)，改标准不用改代码。详见 [精选与校准](docs/selection.md)。

### 聚簇与热点

同一件事，发改委发一篇、几家能源监管机构转述、媒体再报道若干次，读者只需要看到一次。它们会被聚成一个**事件**：先用标题摘要的向量（没配向量服务时比文字重合度）在最近两周里找候选，再让模型判断是同一件事、后续进展，还是两件事；拿不准的合并，写入前再让模型复核一遍。

**热度**按事件算，不按文章算：48 小时内，每个独立来源只算一次，24 小时减半。重复抓取不会多算，所以排在前面的，是真正有很多来源在说的事。

### 你会得到什么

| | |
|---|---|
| **六种信源** | RSS、网页列表、JSON 接口、X 账号、微信公众号，以及你自己脚本推送进来的内容。信源分三级（官方一手、官方账号与准官方、媒体与个人），各级入选门槛不同；抓取频率按产出自动调整 |
| **精选** | 预筛，同一份评分标准独立打两次分，再按信源分级的门槛决定入选；同一条新闻只占一条，换个说法的重复不进。提示词和门槛全部公开，全部可以改；用自己标注的样本在 SelectBench 里校准 |
| **写作** | 中文标题、答案先行的摘要、推荐理由，外文全文翻译；分类、标签和新闻事实单独抽取；防止模型把原文没提到的机构写进标题 |
| **聚簇** | 不同来源报道的同一件事聚成一个事件，后续进展挂在同一个事件下，事件页有综述；人工改过的归属不会被覆盖 |
| **热点** | 按事件算热度：独立来源越多越靠前；和 6 小时前比，涨得快的标上升，新出现的标"新" |
| **日报、周报、月报** | 每天出日报（默认 08:00），按规则编出当天要闻：一件事一条，报过的事只在有新进展时跟进。每周一出周报、每月 1 日出月报，从日报里汇编。出刊时间在 `site/site.ts` 的 `EDITION_TIMES` 里改 |
| **主题与搜索** | 机构与企业、业务方向、内容形态三类主题页；标题摘要搜索和全文相关搜索 |
| **给 Agent 用** | RSS（精选、全部、全文、日报、周报、月报）、公开 API、MCP、Agent Markdown、`llms.txt`，同一份内容给人看也给 Agent 用 |
| **后台** | 信源管理与试抓、内容诊断、精选评测、每一步单独换模型、付费服务的预算熔断、运行记录与告警 |

## 文档

| 文档 | 内容 |
|---|---|
| [信源](docs/sources.md) | 六种信源怎么配，分级和全文，抓取频率，旧文和存档，固定起点 `publishedAfter`，外部推送接口 |
| [精选与校准](docs/selection.md) | 一条资料怎么变成精选、怎么编进日报周报月报，怎么用自己的样本校准 |
| [事件归组与关系评测](docs/grouping.md) | 事件关系怎么判断，怎么用自己标注的成对样本评测 |
| [综述评测](docs/story-digest-evaluation.md) | 改事件综述提示词前，怎么在同一批事件上并排比较 |
| [部署](docs/deploy.md) | Docker、域名和 HTTPS、中国大陆、更新、备份、花多少钱，不用 Docker 时怎么跑 |
| [架构](docs/architecture.md) | 三个进程、几条不变的规则、目录、模块、数据库迁移、对外出口、测试 |
| [把它改成你的行业](docs/customize.md) | 换一个行业时，站名、分类、主题、信源、提示词、门槛、品牌分别改哪里 |

技术栈：Node.js 24 · TypeScript · React Router（服务端渲染）· Fastify · PostgreSQL · pg-boss · Tailwind CSS · Docker Compose。

## 许可

代码使用 [MIT 许可证](LICENSE)。字体有自己的许可，见 [NOTICE](NOTICE)。本仓库的框架代码派生自一个 MIT 许可的开源项目，著作权归原作者（数字生命卡兹克）所有；本站的名称、图标、文案与行业知识与该项目无关，也不使用它的名字和 Logo。
