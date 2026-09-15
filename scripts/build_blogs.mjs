import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_FIELDS = [
  "slug",
  "date",
  "title",
  "title_zh",
  "summary",
  "summary_zh",
  "category",
  "category_zh",
  "tags",
  "cover",
  "source_post",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function camelCase(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

export function parsePost(markdownText, sourcePath = "<memory>") {
  const match = markdownText.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing frontmatter in ${sourcePath}`);
  }

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator < 1) {
      throw new Error(`Invalid frontmatter line in ${sourcePath}: ${line}`);
    }
    const key = line.slice(0, separator).trim();
    frontmatter[key] = parseValue(line.slice(separator + 1));
  }

  for (const field of REQUIRED_FIELDS) {
    if (frontmatter[field] === undefined || frontmatter[field] === "") {
      throw new Error(`Missing ${field} in ${sourcePath}`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.date)) {
    throw new Error(`Invalid ISO date in ${sourcePath}: ${frontmatter.date}`);
  }
  if (!Array.isArray(frontmatter.tags)) {
    throw new Error(`tags must be a bracketed list in ${sourcePath}`);
  }

  return {
    ...Object.fromEntries(Object.entries(frontmatter).map(([key, value]) => [camelCase(key), value])),
    body: match[2].trim(),
    sourcePath,
  };
}

export function sortPostsNewestFirst(posts) {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

function coverPath(post, rootPrefix) {
  const normalized = post.cover.replace(/^(?:\.\.\/)+/, "");
  return `${rootPrefix}${normalized}`;
}

function formatDate(date, locale) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function navLink(href, icon, label, current = false) {
  return `<a href="${href}"${current ? ' aria-current="page"' : ""}><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span></a>`;
}

function renderHeader({ locale, rootPrefix, blogHref, isCurrent }) {
  const chinese = locale === "zh";
  const homeHref = chinese ? "../" : rootPrefix;
  const brandName = chinese ? "陈彬" : "Bin Chen";
  const labels = chinese
    ? { home: "主页", about: "关于", publications: "论文", projects: "项目", blogs: "博客", news: "动态", menu: "菜单", toggle: "切换夜间模式", dark: "夜间", nav: "主导航" }
    : { home: "Home", about: "About", publications: "Publications", projects: "Projects", blogs: "Blogs", news: "News", menu: "Menu", toggle: "Toggle dark mode", dark: "Dark", nav: "Main navigation" };
  return `<header class="site-header">
  <nav class="nav shell" aria-label="${labels.nav}">
    <a class="brand" href="${homeHref}" aria-label="${labels.home}"><img class="brand-logo brand-logo-day" src="${rootPrefix}image/mine/chenbin_Logo.png" alt="" /><img class="brand-logo brand-logo-night" src="${rootPrefix}image/mine/chenbin_Logo.png" alt="" /><span class="brand-name">${brandName}</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu">${labels.menu}</button>
    <div class="nav-links" id="site-menu">
      ${navLink(homeHref, "fa-house", labels.home)}
      ${navLink(`${rootPrefix}about/`, "fa-user", labels.about)}
      ${navLink(`${rootPrefix}publications/`, "fa-book-open", labels.publications)}
      ${navLink(`${rootPrefix}projects/`, "fa-diagram-project", labels.projects)}
      ${navLink(blogHref, "fa-pen-nib", labels.blogs, isCurrent)}
      ${navLink(`${rootPrefix}news/`, "fa-newspaper", labels.news)}
      <button class="theme-toggle" type="button" aria-label="${labels.toggle}" aria-pressed="false" title="${labels.toggle}"><i class="fa-solid fa-moon" aria-hidden="true"></i><span class="theme-toggle-label">${labels.dark}</span></button>
    </div>
  </nav>
</header>`;
}

function renderFooter(rootPrefix) {
  return `<footer class="site-footer"><div class="shell footer-inner"><span class="footer-credit">&copy; Reserved by <i class="fa fa-heart footer-heart" aria-hidden="true"></i>&nbsp;Bin Chen. <span id="current-year">2026</span>.</span><span class="footer-unit-logo" aria-label="Northwest A&amp;F University"><span class="footer-logo-item"><img class="footer-logo-nwafu" src="${rootPrefix}image/mine/nwafu-logo.png" alt="Northwest A&amp;F University" /></span></span></div></footer>`;
}

function renderDocument({ locale, title, description, rootPrefix, blogHref, content }) {
  const lang = locale === "zh" ? "zh-CN" : "en";
  const skipText = locale === "zh" ? "跳到正文" : "Skip to content";
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | Bin Chen</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="icon" href="${rootPrefix}image/mine/favicon.ico" type="image/x-icon" />
    <script>(() => { try { const theme = localStorage.getItem("theme"); if (theme) document.documentElement.dataset.theme = theme; } catch {} })();</script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
    <link rel="stylesheet" href="${rootPrefix}css/styles.css" />
    <script defer src="${rootPrefix}js/main.js"></script>
  </head>
  <body class="blogs-page">
    <a class="skip-link" href="#main">${skipText}</a>
    ${renderHeader({ locale, rootPrefix, blogHref, isCurrent: true })}
    <main id="main">${content}</main>
    ${renderFooter(rootPrefix)}
  </body>
</html>`;
}

function renderBlogCard(post, locale, href, rootPrefix, featured = false) {
  const chinese = locale === "zh";
  const title = chinese ? post.titleZh : post.title;
  const summary = chinese ? post.summaryZh : post.summary;
  const category = chinese ? post.categoryZh : post.category;
  const tags = post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `<article class="blog-card${featured ? " blog-card-featured" : ""}"><a href="${href}"><span class="blog-card-visual"><img src="${coverPath(post, rootPrefix)}" alt="${escapeHtml(title)}" loading="lazy" /></span><span class="blog-card-body"><span class="blog-card-meta">${escapeHtml(category)} · ${formatDate(post.date, locale)}</span><strong>${escapeHtml(title)}</strong><span class="blog-card-summary">${escapeHtml(summary)}</span><span class="blog-card-tags">${tags}</span><span class="blog-card-action">${chinese ? "阅读英文原文" : "Read article"} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></span></a></article>`;
}

function renderIndexContent(posts, locale, rootPrefix) {
  const chinese = locale === "zh";
  const featured = posts[0];
  const toArticle = (post) => chinese ? `../../blogs/posts/${post.slug}/` : `posts/${post.slug}/`;
  const archive = posts.slice(1).reduce((groups, post) => {
    const year = post.date.slice(0, 4);
    (groups[year] ??= []).push(post);
    return groups;
  }, {});
  const groups = Object.entries(archive)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, yearPosts]) => `<section class="blog-year-group" aria-labelledby="blog-year-${year}"><h3 id="blog-year-${year}">${year}</h3><div class="blog-card-grid">${yearPosts.map((post) => renderBlogCard(post, locale, toArticle(post), rootPrefix)).join("\n")}</div></section>`)
    .join("\n");
  const hero = chinese
    ? { eyebrow: "技术写作与科研笔记", title: "博客", featuredLabel: "精选文章", continuum: "写作脉络", archiveLabel: "全部文章", archiveDescription: "围绕农业人工智能、遥感、科研写作、Python、Git、服务器运维与 AI 工具的技术记录。", selected: "精选内容" }
    : { eyebrow: "Technical Writing & Research Notes", title: "Blogs", featuredLabel: "Featured Writing", continuum: "Writing Continuum", archiveLabel: "All Posts", archiveDescription: "Technical notes on agricultural AI, remote sensing, scientific writing, Python, Git, servers, and AI tools.", selected: "Selected writing" };
  const languageLink = chinese
    ? { href: "../../blogs/", label: "English index" }
    : { href: "../zh/blogs/", label: "中文索引" };
  return `<section class="page-hero compact-page-hero shell"><p class="eyebrow">${hero.eyebrow}</p><div class="blog-hero-title-row"><h1>${hero.title}</h1><a class="blog-index-language-link" href="${languageLink.href}">${languageLink.label}</a></div></section><section class="section shell page-content-section blogs-portfolio" aria-label="${hero.title}"><section class="blog-stage blog-stage-featured" aria-labelledby="featured-writing-title"><header class="project-stage-heading"><span class="project-stage-number" aria-hidden="true">01</span><div class="project-stage-copy"><p class="project-stage-label">${hero.featuredLabel}</p><h2 id="featured-writing-title">${escapeHtml(chinese ? featured.titleZh : featured.title)}</h2></div><span class="project-stage-period">${formatDate(featured.date, locale)}</span></header>${renderBlogCard(featured, locale, toArticle(featured), rootPrefix, true)}</section><div class="project-stage-transition blog-stage-transition" aria-hidden="true"><span></span><span>${hero.continuum}</span><span></span></div><section class="blog-stage blog-stage-archive" aria-labelledby="all-posts-title"><header class="project-stage-heading"><span class="project-stage-number" aria-hidden="true">02</span><div class="project-stage-copy"><p class="project-stage-label">${hero.continuum}</p><h2 id="all-posts-title">${hero.archiveLabel}</h2><p class="project-stage-description">${hero.archiveDescription}</p></div><span class="project-stage-period">${hero.selected}</span></header>${groups}</section></section>`;
}

export function renderBlogIndex(posts, locale = "en") {
  const rootPrefix = locale === "zh" ? "../../" : "../";
  const blogHref = "./";
  const title = locale === "zh" ? "博客" : "Blogs";
  const description = locale === "zh" ? "Bin Chen 的技术写作与科研笔记。" : "Technical writing and research notes by Bin Chen.";
  return renderDocument({ locale, title, description, rootPrefix, blogHref, content: renderIndexContent(posts, locale, rootPrefix) });
}

function renderArticle(post, bodyHtml) {
  const rootPrefix = "../../../";
  const content = `<section class="page-hero compact-page-hero shell blog-article-hero"><p class="eyebrow">${escapeHtml(post.category)} · ${formatDate(post.date, "en")}</p><h1>${escapeHtml(post.title)}</h1><p class="blog-article-summary">${escapeHtml(post.summary)}</p><div class="blog-language-switch"><a href="../../">All English posts</a><a href="../../../zh/blogs/">中文博客索引</a></div></section><article class="shell blog-article"><figure class="blog-article-cover"><img src="${coverPath(post, rootPrefix)}" alt="${escapeHtml(post.title)}" /></figure><div class="blog-article-body">${bodyHtml}</div></article>`;
  return renderDocument({ locale: "en", title: post.title, description: post.summary, rootPrefix, blogHref: "../../", content });
}

function renderWithPandoc(post) {
  try {
    return execFileSync("pandoc", ["--from", "markdown", "--to", "html5"], { input: post.body, encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("Pandoc is required to build blogs.");
    }
    throw error;
  }
}

function readPosts(contentDir) {
  if (!fs.existsSync(contentDir)) {
    throw new Error(`Blog content directory does not exist: ${contentDir}`);
  }
  const sourceFiles = fs.readdirSync(contentDir)
    .filter((file) => file.endsWith(".md") && file !== "_template.md")
    .sort();
  if (sourceFiles.length === 0) {
    throw new Error("No blog sources found in blogs/content. Add English Markdown sources before building.");
  }
  return sortPostsNewestFirst(sourceFiles.map((file) => parsePost(fs.readFileSync(path.join(contentDir, file), "utf8"), file)));
}

export function buildBlogs({ rootDir = process.cwd() } = {}) {
  const posts = readPosts(path.join(rootDir, "blogs", "content"));
  fs.writeFileSync(path.join(rootDir, "blogs", "index.html"), renderBlogIndex(posts, "en"));
  fs.mkdirSync(path.join(rootDir, "zh", "blogs"), { recursive: true });
  fs.writeFileSync(path.join(rootDir, "zh", "blogs", "index.html"), renderBlogIndex(posts, "zh"));
  for (const post of posts) {
    const outputPath = path.join(rootDir, "blogs", "posts", post.slug, "index.html");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, renderArticle(post, renderWithPandoc(post)));
  }
  return posts;
}

const executedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executedDirectly) {
  try {
    const posts = buildBlogs();
    console.log(`Built ${posts.length} blog posts.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
