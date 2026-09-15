# Blogs 页面与英文文章库设计

**日期：** 2026-09-16
**状态：** 已获用户设计确认，等待规格审阅后实施

## 1. 目标与边界

在 Bin Chen 的个人主页中新增一个双语 Blogs 板块，用于展示并保存既有 22 篇技术博客。该板块须沿用当前 Projects 页的视觉语言，位于导航中的 Projects 与 News 之间。

本次工作包括：

- 复制 `/Users/binchen/.codex/skills/blog-post-publisher/posts/` 中的 22 篇 `.qmd` 文章进入主页仓库；原目录保持只读，不做改写。
- 将每篇文章的全文、标题、摘要、分类与标签翻译成英文。
- 提供英文与中文两个索引页；两个索引页均链接到同一份英文正文。
- 为每篇文章生成并接入一张独立的横版缩略图。
- 建立可重复使用的本地生成流程，支持以后直接编写英文博客。

不在本次范围内：翻译或改动原 Tech Blog 仓库、把已发布的外部 Tech Blog 作为正文依赖、重构其他页面内容。

## 2. 信息架构

```text
主页导航
  Home | About | Publications | Projects | Blogs | News

Blogs
  blogs/index.html             英文文章索引
  zh/blogs/index.html          中文文章索引
  blogs/posts/<slug>/index.html 英文文章全文（唯一正文）
  blogs/content/<slug>.md      英文 Markdown 内容源
  image/blogs/<slug>.png       文章独立缩略图
```

英文与中文索引页面展示相同的文章集合和封面；差异仅限于标题、摘要、类别和界面文案。每张卡片均进入同一英文文章详情页。详情页提供回到 English Blogs 和中文博客索引的链接，避免制造两套正文。

## 3. 内容源与生成流程

每篇文章使用一个英文 Markdown 源文件，含一个受控的 YAML 风格元数据区：

```yaml
---
slug: 2026-4-24-drone-rice-growth-stage-inversion
date: 2026-04-24
title: AI and UAV Remote Sensing for Rice Growth-Stage Inversion
title_zh: 无人机水稻生育期反演预测：AI + 遥感的技术方案
summary: English article summary.
summary_zh: 中文索引摘要。
category: Agricultural AI
category_zh: 农业 AI
tags: [UAV, Rice, Remote Sensing]
cover: ../../image/blogs/2026-4-24-drone-rice-growth-stage-inversion.png
source_post: 2026-4-24-drone-rice-growth-stage-inversion.qmd
---
```

`scripts/build_blogs.mjs` 将使用本机的 `pandoc` 把 Markdown 正文转换为 HTML，并基于现有站点头部、页脚与 CSS 生成：

- 英文索引 `blogs/index.html`；
- 中文索引 `zh/blogs/index.html`；
- 22 个英文详情页 `blogs/posts/<slug>/index.html`。

生成结果作为静态文件提交。GitHub Pages 仅托管已生成内容，不需要在线安装 Node、Pandoc 或 Quarto。

以后新增博客的流程是：创建一份英文 Markdown、生成一张封面、执行 `node scripts/build_blogs.mjs`、检查生成页面并提交。`blogs/README.md` 将记录该流程和可复制的元数据模板。

## 4. 页面设计

### 4.1 英文索引

- 页面标题：`Blogs`，副标题：`Technical Writing & Research Notes`。
- 顶部特色区：`01 Featured Writing`，展示最近发表的一篇文章的大卡片。
- 过渡分隔线：`Writing Continuum`。
- 归档区：`02 All Posts`，按年份分组展示其余文章卡片；最新文章在前。
- 卡片沿用 Projects 页的圆角、图片比例、阴影、深色模式、悬停和响应式网格。

### 4.2 中文索引

- 页面标题：`博客`，副标题：`技术写作与科研笔记`。
- 顶部特色区：`01 精选文章`。
- 过渡分隔线：`写作脉络`。
- 归档区：`02 全部文章`。
- 使用中文标题、摘要、分类和日期格式；点击统一进入英文正文。

### 4.3 文章详情页

- 使用现有站点全局导航、品牌、主题切换和页脚。
- 顶部展示类别、日期、英文标题、摘要和宽幅封面。
- 正文按 Pandoc 输出的标题、段落、代码块、表格、引用和链接呈现。
- 页面底部提供 `All English posts` 与 `中文博客索引` 回链。

## 5. 缩略图规范

- 每篇文章生成一张独立 PNG，画面比例 16:9，目标尺寸 1536×864 或等比例尺寸。
- 统一风格：干净的科研技术编辑插画，低饱和蓝绿与土壤暖色，适合学术个人主页。
- 每张图仅表现文章主题（例如无人机遥感、作物模型、Git 分支、终端工具、服务器、科研写作）；不得包含文字、品牌 Logo、水印或不可读的伪文字。
- 生成后逐张检查画面主题、裁切、对比度和卡片缩放效果。所有最终图片放入 `image/blogs/`。

## 6. 导航与语言规则

- 在 `index.html`、`zh/index.html`、`about/index.html`、`publications/index.html`、`projects/index.html` 和 `news/index.html` 的主导航中，将 Blogs 插入 Projects 和 News 之间。
- 新增的两个 Blogs 索引页彼此提供语言切换；原有页面维持当前的中英文导航行为，不将不存在的中文子页伪造为可用链接。
- 文章页不翻译正文；语言入口的语义为“浏览中文索引”而非“阅读中文译文”。

## 7. 文章覆盖范围

源文件集合固定为 `posts/` 下 22 个文章 `.qmd` 文件（排除 `index.qmd`）。它们按发布日期倒序出现在索引中，覆盖农业 AI、遥感、科研写作、Python、Git、服务器运维、Codex 和 AI 工具等主题。

## 8. 验证与验收

- 确认原 `posts/` 文件的 SHA-256 在任务前后完全一致。
- 确认英文 Markdown 内容源为 22 篇、生成英文详情页为 22 个、每个详情页有对应卡片和封面。
- 对所有生成 HTML 做语法解析；检查内部链接、图片路径、标题和语言切换目标。
- 运行 `git diff --check`，检查工作区中没有误加入原 `posts/`、临时文件或未选用的图片。
- 本地启动静态服务器，至少检查英文索引、中文索引、一个农业 AI 文章页和一个开发工具文章页的桌面与窄屏布局。
- 推送后检查 GitHub Pages 构建状态，并读取线上 HTML 验证 Blogs 导航、文章数和封面引用。

## 9. 风险与处理

- **翻译准确性：** 保留代码、命令、文件名、配置键和可执行示例；不将示例中的敏感内容带入新文章。
- **图片批量生成：** imagegen 逐篇生成；失败时记录具体文章并只重试该篇，避免重复生成整批。
- **生成依赖：** 本机使用已验证可用的 Pandoc；若未来环境缺失，则生成脚本给出清晰错误而不修改已生成页面。
- **内容漂移：** 新主页的英文 Markdown 是新正文的唯一来源；原中文 `.qmd` 仅作为历史来源与翻译对照，不参与发布。
