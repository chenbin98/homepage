# Blogs 页面调研记录

## 仓库状态

- 当前分支：`master`，与 `origin/master` 同步。
- 最近提交：`9ad1a12 Add Tech Blog link to profile`。
- 当前工作区在任务开始时干净。

## 用户目标

- 新增 Blogs 页面和导航入口。
- 内容来源是 blog-post-publisher skill 下现有 `posts/`。
- 需要复用当前主页的双语和项目卡片式设计。

## 设计约束

- `brainstorming` 将该任务判定为架构型改造：先调研与设计审批，再实施。
- `imagegen` 使用内置工具；最终图片必须复制到当前主页仓库，不可只留在生成目录。
- 当前主页仓库没有现成的构建系统；本机可用 `pandoc` 和 `node`，但未检测到 Quarto。因此推荐保留英文 Markdown 作为内容源，并使用一个轻量的本地生成脚本产出、提交静态 HTML，不依赖 GitHub Pages 运行时构建。

## 现有站点结构

- 站点是手写静态 HTML/CSS/JS，不是 Quarto；主页面包括 Home、About、Publications、Projects、News。
- Projects 页已有可复用的两段式结构：顶部 Current Research，分隔线 Research Continuum，下面 Selected Projects 卡片网格。
- 当前只有首页存在中文版本 `zh/index.html`；About、Publications、Projects、News 均指向英文页面，没有 `zh/projects/` 等中文子页。
- 因此 Blogs 可以成为第一个完整双语子页面：`blogs/index.html` 与 `zh/blogs/index.html`，并通过语言按钮互相切换。

## 文章盘点

- `posts/` 中有 22 篇文章和 1 个 Quarto listing 文件。
- 文章时间范围为 2025-06-01 至 2026-09-02，正文和标题以中文为主。
- 多数 2025 年早期文章缺少 `description`；2025-09 之后大多已有标题、日期、分类、标签和摘要。
- 内容主题可归并为农业 AI/遥感、科研写作、Python/Git、Codex/AI 工具、服务器与运维。
- 当前主页仓库不是原 Tech Blog 仓库；原始 posts 保持只读，主页仓库保存独立的英文 Markdown 派生稿和静态输出。

## 用户确认的内容策略

- 原 `posts/` 文件夹只读，不做任何改写。
- 22 篇历史文章复制进主页仓库，并全文翻译成英文。
- 采用“双语索引 + 英文原文”：英文索引使用英文元数据，中文索引使用中文元数据，但正文统一为英文。
- 后续新博客默认使用英文创作。
- 上一版“链接到外部 Tech Blog 中文原文”的建议已被用户明确否决，不再采用。
- 用户确认 22 篇文章采用一篇一张的独立缩略图；将使用统一画面语言以保证卡片网格的视觉一致性。

## 实施与验证结果

- `scripts/build_blogs.mjs` 使用本机 Pandoc 把 `blogs/content/*.md` 生成英文详情页，并生成两个双语索引；GitHub Pages 只需提供已提交的静态文件。
- 页面采用 Projects 页的阶段式构图：Featured Writing、Writing Continuum 与按年份分组的 All Posts；中文索引对应显示精选文章、写作脉络与全部文章。
- 首页与英文页中的 Blogs 链接使用 `blogs/` 或 `../blogs/`，中文首页使用 `blogs/`，均解析到目标页。
- 本地服务器下，英文索引、中文索引、代表性详情页及代表性封面均返回 HTTP 200；浏览器首屏确认了导航、特色卡片、封面与语言切换链接。
