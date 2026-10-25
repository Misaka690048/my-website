# 个人网站

Astro 纯静态内容站，使用 TypeScript、Tailwind CSS 和 Markdown。
工程基准与实施步骤见上级目录的 `../docs/`。

## 当前页面

| 地址 | 内容 |
| --- | --- |
| `/` | 首页与笔记列表 |
| `/posts/first-note/` | Markdown 示例文章 |
| `/404.html` | 自定义错误页；未知地址由 Wrangler 的静态资源规则返回该页面 |

## 内容结构

```text
src/
├── components/PostDate.astro   # 日期显示
├── content/posts/first-note.md # 示例文章
├── content.config.ts          # 文章字段校验
├── layouts/BaseLayout.astro   # 页面骨架、导航、全局样式
├── pages/
│   ├── index.astro
│   ├── 404.astro
│   └── posts/[id].astro       # 构建时生成文章页
└── styles/global.css          # Tailwind 与文章排版
```

新增文章时，在 `src/content/posts/` 下添加 Markdown 文件，并填写 `title`、`description`、`pubDate`。
目前采用平铺目录，文件名使用小写英文和连字符，如 `first-note.md`，对应 `/posts/first-note/`；路径统一保留尾部斜杠。
首页会自动读取文章并按日期倒序排列。示例内容可替换，已公开的文章地址变更时需考虑重定向。

## 本地命令

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm preview
```

验证 Cloudflare 静态资源的路由与 404 行为时，先构建，再运行 `pnpm exec wrangler dev`。
按项目 `AGENTS.md` 的要求，开发服务器使用 `pnpm exec astro dev --background`，通过 `pnpm exec astro dev stop` 停止。

## 上线前待确认

- `astro.config.mjs` 的 `site` 仍为 `https://example.com` 占位，需要替换为正式域名。
- `wrangler.jsonc` 的兼容日期需在首次部署时核对。
- 自定义 404 文件已生成，实际 HTTP 状态码和浏览器效果需要在本地运行验证；正式站仍需单独验收。
