# imisslog 个人网站

Astro 纯静态内容站，使用 TypeScript、Tailwind 4、共享 CSS 与 Markdown；通过 GitHub → Cloudflare Workers Builds 发布。

> 更新：2026-11-05。本轮栏目、标签、阅读布局等改版仍是本地未提交工作，并未因此发布到正式网站。用户已验收统一宽度／侧栏、折叠标记和代码框；字体暂时保留。最新胶囊导航圆角尚待明确确认。

## 页面与内容

| 地址 | 用途 |
|---|---|
| `/` | 居中诗句、社交图标、最新十条 Writing／Notes 混合内容 |
| `/writing/` | 合并后的文章列表（含原笔记）和右侧标签交集筛选；`/notes/` 跳转至此 |
| `/tags/` | 按“小说”“电子与计算机”分组的标签目录 |
| `/tags/标签名/` | 标签标题、简介和跨栏目文章列表 |
| `/about/` | 八语宣言占位内容，最终布局由用户设计 |
| `/posts/文件名/` | 两栏目的统一正文地址 |
| `/404.html` | 自定义错误页 |
| `/search-index.json` | 当前构建环境的公开内容搜索索引 |
| `/mirrow-world/` | 全部作品封面 |
| `/mirrow-world/[id]/` | 有已填写评价的作品正文；没有评价不生成页面 |
| `/design-preview/` | 仅开发模式排版样张，不生成生产页面 |

正式内容写入 `src/content/posts/*.md`，平铺、小写英文连字符文件名，不能与 `src/preview/content/*.md` 重名。必填 `title`、`description`、`pubDate`；`category` 为 `writing` 或 `notes`（默认 notes）；`tags` 为不带 `#` 的字符串数组；`author` 可选。页面日期为英文短月份格式（如 Nov 6, 2026，按北京时间），只展示发布日期；description 不作为可见摘要，仍供元数据与搜索使用。

测试内容在 `src/preview/content/`，现纳入 Git，供本轮网上测试。`src/data/publication.json` 的 `includeTestContent` 当前为 `true`：生产构建也加载样例，并展示 `preview: true` 的文章、作品和评论，其正文仍保留 noindex。以后改为 `false` 并重新构建发布，即恢复生产排除测试内容；本地开发始终显示样例。该开关不删除 Git 中的文件，`preview` 也不提供隐私保护。未来日期和 `draft: true` 不是定时／草稿功能。

## 维护入口

| 文件 | 职责 |
|---|---|
| `src/styles/global.css` | 主题、全站 700px 主内容／页脚、224px 侧栏及 32px 间距、字体、动效 |
| `src/layouts/CollectionLayout.astro`、`PostLayout.astro` | 栏目列表／标签、正文／目录 |
| `src/components/PostList.astro`、`PostDate.astro`、`TagLinks.astro` | 标题、日期、标签及跨页过渡 |
| `src/data/tag-catalog.json`、`src/lib/tag-catalog.ts` | 标签分组、简介及详情页链接 |
| `src/data/poems.json`、`socials.ts` | 诗句库及四个账号地址（目前地址为空） |
| `scripts/subset-poetry-font.py` | 修改诗句后重新生成自托管诗句字体 |
| `src/components/Footer.astro`、`src/lib/site-age.ts` | 页脚与北京时间建站天数，起始 2026-10-27 |
| `astro.config.mjs`、`src/scripts/code-copy.ts` | 代码高亮、语言标注、复制交互 |
| `src/scripts/site.ts`、`filters.ts` | 主题、搜索、滚动、导航、目录及标签筛选 |
| `src/assets/fonts/`、`src/assets/icons/` | 字体／图标及许可 |
| `src/content/works/*.json`、`src/content/reviews/*.md` | 作品资料与可选评价，分开维护 |
| `src/components/WorkShelf.astro`、`WorkCover.astro`、`src/styles/works.css` | 书架、正文封面、悬停和光晕 |

普通中英文优先调用本机衬线字体，最终自托管方案待定；诗句与署名使用自托管朱雀仿宋 Regular 子集，代码使用打包的 DejaVu Sans Mono。修改诗句后需同步生成并提交 `poetry-zhuque.ttf`。首页最新十条、标签统计、搜索索引、文章路由与站点地图由内容自动生成。

Mirrow World 在首页 Latest 下展示前六部作品（`order` 越小越靠前），总览展示全部。作品封面放 `src/assets/covers/`，JSON 的 `cover` 是相对该 JSON 的文件路径；`review` 可省略，填写时对应 `src/content/reviews/` 文件名（不含 `.md`）。仅有正文且在当前环境可见的评价开放链接和搜索。评价不混入 Writing／Latest；发布日期 `pubDate` 可选，没有就不显示日期。当前《哀鸿》和《林翩翩传》均为 `preview: true`，本轮网上测试因 `includeTestContent: true` 一并展示；关闭该开关后会再次从生产作品列表、正文路由和搜索中排除。

## 本地检查

```bash
pnpm exec astro dev --background
pnpm exec astro dev status
```

打开输出中的 localhost 地址。后台服务用 `pnpm exec astro dev stop` 停止，日志用 `pnpm exec astro dev logs` 查看。开发页脚的 Typography preview／Navigation 不会进入生产。

```bash
pnpm check && pnpm build
node --test --test-isolation=none tests/*.test.mjs
```

构建后可用 `pnpm preview` 查看产物；需要核对 Cloudflare 路由、响应头及 404 时使用 `pnpm exec wrangler dev`，结束按 Ctrl+C。本轮生产构建包含测试内容；只有关闭 `includeTestContent` 后，开发页与生产产物的文章／作品数量才不同。`/design-preview/` 及页脚开发入口始终只在本地开发出现。

## 发布与文档

先在工作分支检查与提交 → Cloudflare 分支预览 → GitHub PR 合并 main → 确认生产部署 → 线上验收 → 同步本地。当前有未提交改版，不要直接清空、拉取覆盖或推 main。

- [运维手册](../docs/运维手册.md)：VS Code 写作、栏目／标签、图片／代码、诗句／社交／字体维护和完整发布步骤。
- [设计记录](../docs/网站设计参考与偏好.md)：第 11 节为当前方案，第 13 节为验收依据。
- [Runbook](../docs/runbook.md)：第 12.7 节为当前剩余事项。

`../docs/` 位于网站仓库之外，在本机可打开，但不会随本仓库推送；GitHub 上不应假定这些相对链接可访问。文档需单独保存。本轮未自动提交、推送或部署。

首页诗文字体来源：朱雀仿宋 v0.212（https://github.com/TrionesType/zhuque/releases/tag/v0.212）。仅裁剪字符，保留原字形与字体许可元数据；许可位于 `public/fonts/Zhuque-OFL.txt`。新增诗文后运行 `python3 scripts/subset-poetry-font.py`；原始字体默认位于仓库外的 `../references/zhuque-v0.212/ZhuqueFangsong-Regular.ttf`，也可通过第一个参数指定路径。
