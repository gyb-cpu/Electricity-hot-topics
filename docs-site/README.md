# 电力热点宝文档站

用 [Mintlify](https://mintlify.com) 搭的文档站。**和主工程完全隔离**：不在主工程的 npm workspaces 里，不参与 `npm run typecheck`、`npm test` 和 Docker 构建。

## 跑起来

```bash
cd docs-site
node scripts/make-openapi.ts   # 第一次跑，或者改了公开接口之后
npx mintlify dev
```

打开 <http://localhost:3000>（被占用就顺延）。

## 目录

页面和 `docs.json` **平级**，这是 Mintlify v4 的要求：

```
docs-site/
  docs.json              导航、主题色、logo、openapi 入口
  index.mdx              首页
  quickstart.mdx         快速开始
  sources.mdx            信源
  selection.mdx          精选与校准
  grouping.mdx           事件归组与热度
  deploy.mdx             部署
  architecture.mdx       架构
  customize.mdx          把它改成你的行业
  api/agent.mdx          给 Agent 用
  openapi.json           由 site/public/openapi-v1.json 生成
  scripts/make-openapi.ts
  assets/logo.svg        取自 site/brand/logo.svg
```

侧边栏的标题读的是每个 `.mdx` 的 frontmatter `title`。文件名只决定网址，标题不会从文件名生成 —— 这也是为什么导航里要写对 slug：写错了，CLI 找不到文件，回退成用文件名拼一个英文标题。

## 语言

文档站是中文单语，不加语言切换器 —— 没有英文版内容，切换过去只会是空白。

## 接口参考

`docs.json` 里最后一组：

```json
{ "group": "接口参考", "icon": "brackets-curly", "openapi": "/openapi.json" }
```

`openapi` 写在导航的组里，Mintlify 按定义生成 25 个端点页（`/api-reference/*`）。**不能写在 `docs.json` 顶层** —— CLI 会扫描所有带 `openapi` 字段的 `.json`，把 `docs.json` 自己当接口定义校验，然后报
`Error validating OpenAPI file /docs.json: Can't find supported Swagger/OpenAPI version`。

## OpenAPI 从哪来

不用手写：

```bash
node scripts/make-openapi.ts
```

它读主工程的 `site/public/openapi-v1.json`（发布时带 `{{占位符}}` 的模板），做三件事，写成 `docs-site/openapi.json`。**主工程那份不动。**

1. 替换 `{{占位符}}`：站名、站点地址、版本号、出刊时间、分类表。
2. `summary` 换成中文 —— Mintlify 拿 `summary` 当接口页的标题，不换就是 `List recent public items`。
3. 补三个字段：
   - `x-mint.href`：钉住英文 slug。默认拿 `summary` 拼网址，中文标题会变成一串百分号编码。
   - `x-mint.metadata.sidebarTitle`：抵掉 `x-mint.href` 按 slug 生成的英文标题。
   - `tags`：分组名取自 tag；没有 tag 时 Mintlify 用写死的 `API Reference`。

三张表都按 `operationId` 索引。主工程加了新端点就往表里加一行；漏了不会报错，只是那一页的标题和网址还是英文。

端点页正文里那一句中文说明排在英文原文前面，**英文原文保留** —— 缓存、`If-None-Match`、`Retry-After` 那几段是接口契约的原话，没有动。

## 页面内容

和仓库根目录的 `docs/` 是同一套东西（信源、精选与校准、归组、部署、架构、改行业），写成了 Mintlify 的 MDX 组件形式。**内容以 `docs/` 里那份为准**，两边同步维护。

MDX 里要避开裸的尖括号：`<http://localhost:3000>` 会被当成 JSX，报 `A parsing error occurred`。写成 `[文字](地址)` 或用反引号包起来。

## 用户名是中文时的坑

CLI 解析自己的缓存路径 `~/.mintlify/previews/<port>/...`，路径里有非 ASCII 字符时会直接崩：

```
ENOENT: no such file or directory, open 'C:\Users\<中文用户名>\.mintlify\previews\4000\mint\apps\client\.next\required-server-files.json'
```

把 home 指到一个纯英文的目录就能跑：

```powershell
$env:USERPROFILE = "C:\mfhome"
$env:HOME = "C:\mfhome"
npx mintlify dev
```

## 上线

Mintlify 是 SaaS：`docs.json`、各个 `.mdx`、`openapi.json`、`assets/` 推上去，它负责渲染和托管。