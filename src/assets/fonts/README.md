# imiss 字体资源与用途

统一入口：`src/styles/fonts.css`；该文件由 `global.css` 引入一次。字号与行高仍留在原组件／样式中。

| 角色 | 变量 | 来源 |
| --- | --- | --- |
| 中文正文、章节、导航、列表、标签；英文普通正文 | `--font-serif` | 系统 Noto Serif／Noto Serif SC／思源宋体与宋体回退 |
| 英文展示标题、首页 Latest／Mirrow World | `--font-display` | 本地 EB Garamond 拉丁子集（500–650）；失败时回退 Georgia／Times New Roman，中文沿用 serif 栈 |
| 首页诗句、作者、作品名 | `--font-poetry` | 本地 `poetry-zhuque.ttf`，注册名 Poetry Fangsong |
| 显式 `.quoted` 引用 | `--font-fangsong` | 复用 Poetry Fangsong，同一字体 URL，不重复加载 |
| 日期、年份、普通栏目小标题、统计、页脚 | `--font-mono` | 系统 Courier New 等宽字体栈 |
| 代码、语言标识、kbd／samp | `--font-code` | 本地 DejaVuSansMono.ttf，注册名 Site Code |

About 的各语言独立配置保留在 `src/pages/about.astro`，不要统一替换成展示字体。图片 Logo 不受文字字体配置影响。

## EB Garamond：已自托管（2026-11-08）

用户从 Google Fonts 官方仓库下载正体 `../EBGaramond[wght].ttf` 和 `../OFL.txt`。官方来源：https://github.com/google/fonts/tree/main/ofl/ebgaramond 。保留许可证于 `public/fonts/EB-Garamond-OFL.txt`，字体 name 表也保留版权和许可字段。

网页文件：`eb-garamond-latin-500-650.woff`，71,628字节（约70 KiB），源文件851,176字节。使用 WOFF：本次尝试的 WOFF2 未通过本机解码验证，已删除，未接入页面；最终 WOFF 通过 FreeType／Fontconfig 读取及表数据、字重范围验证。后续有标准 WOFF2 工具时可进一步压缩，无需改变字体用途。

只保留正体500–650字重、基本拉丁／Latin-1／Latin Extended-A、组合音标及常用西文标点。保留 kerning 和 ligature 布局表，不打包希腊、西里尔或中文字形；CSS unicode-range 与生成范围一致。仅 `--font-display` 使用它；英文普通正文和 About 宣言不会统一改成 EB Garamond。无外部字体服务和新增运行时依赖。使用 font-display:swap，不强制预加载不需要拉丁展示文字的页面；加载期间可能有回退到实际字形的轻微变化，尚未实测 CLS。

维护命令（离线，依赖系统 HarfBuzz subset 与 Python zlib；不是构建时依赖）：

```sh
python3 scripts/prepare-display-font.py
fc-scan src/assets/fonts/eb-garamond-latin-500-650.woff
pnpm check && pnpm build
```

源文件 SHA-256：`ef9512f92f6d579e5dc75af59a5a4b1b8b47d2eda89e00b954d44520e5369027`。

## CJK 性能取舍

本机 Noto Serif CJK 的完整 TTC 每字重约26–27 MiB，包含多个语言面。拆出 SC 仍包含大量中文字形；不直接发布这些文件。当前保留系统回退，简体中文候选先于繁体候选，并补上 Windows SimSun。

这不等于跨平台完全一致。未来若自托管，宜使用覆盖充分的按 Unicode 分片的 WOFF2，并按实际字符请求；需要测量长文章命中的分片数量与总下载量。不能仅截取现有文章的文字而不维护新文章覆盖，也不要把中日韩字体全部同时下载。当前没有增加中文字体传输量或第三方字体请求。

## 朱雀仿宋用字维护

`poetry-zhuque.ttf` 为子集，不是完整朱雀仿宋。正常诗文显示保持不变；字体原件位于 `../references/zhuque-v0.212/ZhuqueFangsong-Regular.ttf`，许可证见 `public/fonts/Zhuque-OFL.txt`。

新增诗句或静态 `<blockquote class="quoted">…</blockquote>` 后运行：

```sh
python3 scripts/subset-poetry-font.py
```

脚本同时扫描 `src` 下 Markdown／MDX／Astro 文件中的静态 quoted 引文。动态生成的引用需要提供实际文本文件：

```sh
python3 scripts/subset-poetry-font.py ../references/zhuque-v0.212/ZhuqueFangsong-Regular.ttf /path/to/quote-text.txt
```

再运行 `pnpm check && pnpm build`。不在子集内的字会回退；普通 Markdown 引用仍然使用正文衬线字体，不会被全部改成仿宋。

现有 `poetry-serif.otf` 是历史资源，不被当前 CSS 引用。DejaVu 资源与许可证不变。不要从有商业授权限制的系统字体中复制 Courier New／Georgia 到网站。

## 固定文字 Logo

2026-11-08：为消除硬刷新与跨页字体替换引起的跳变，`imisslog.` 改为同一EB Garamond 600字形的内嵌SVG，保留原字距及字号尺度。它不再依赖本表中的网页字体下载。源资源 src/assets/branding/wordmark.svg，生成脚本 scripts/prepare-wordmark.py；使用同一OFL许可来源，链接可访问名称仍由BaseLayout提供。
