import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildBlogs, parsePost, renderBlogIndex, sortPostsNewestFirst } from "../scripts/build_blogs.mjs";

test("parsePost retains bilingual card metadata and body", () => {
  const post = parsePost(`---\nslug: demo\ndate: 2026-09-02\ntitle: English Title\ntitle_zh: 中文标题\nsummary: English summary.\nsummary_zh: 中文摘要。\ncategory: AI Tools\ncategory_zh: AI 工具\ntags: [Codex, GIS]\ncover: ../../image/blogs/demo.png\nsource_post: demo.qmd\n---\n\n## Introduction\n\nBody.`, "demo.md");
  assert.equal(post.slug, "demo");
  assert.equal(post.titleZh, "中文标题");
  assert.deepEqual(post.tags, ["Codex", "GIS"]);
  assert.match(post.body, /## Introduction/);
});

test("sortPostsNewestFirst sorts ISO dates descending", () => {
  const sorted = sortPostsNewestFirst([{ date: "2025-06-01" }, { date: "2026-09-02" }]);
  assert.deepEqual(sorted.map((post) => post.date), ["2026-09-02", "2025-06-01"]);
});

test("featured blog title appears only once in each language index", () => {
  const posts = [{
    slug: "featured-post",
    date: "2026-09-02",
    title: "Featured English Title",
    titleZh: "精选中文标题",
    summary: "English summary.",
    summaryZh: "中文摘要。",
    category: "Research Workflow",
    categoryZh: "科研工作流",
    tags: ["Codex"],
    cover: "image/blogs/featured-post.png",
    sourcePost: "featured-post.qmd",
  }];

  for (const [locale, title] of [["en", "Featured English Title"], ["zh", "精选中文标题"]]) {
    const index = renderBlogIndex(posts, locale);
    const featuredCardTitle = new RegExp(`<article class="blog-card blog-card-featured"[\\s\\S]*?<strong>${title}</strong>`);
    assert.doesNotMatch(index, featuredCardTitle);
  }
});

test("buildBlogs writes bilingual indexes and an English article", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "homepage-blogs-"));
  const contentDir = path.join(root, "blogs", "content");
  fs.mkdirSync(contentDir, { recursive: true });
  const source = [
    "---", "slug: demo", "date: 2026-09-02", "title: English Title", "title_zh: 中文标题",
    "summary: English summary.", "summary_zh: 中文摘要。", "category: AI Tools", "category_zh: AI 工具",
    "tags: [Codex, GIS]", "cover: image/blogs/demo.png", "source_post: demo.qmd", "---", "", "## Introduction", "", "Body.",
  ].join("\n");
  fs.writeFileSync(path.join(contentDir, "demo.md"), source);
  buildBlogs({ rootDir: root });

  const english = fs.readFileSync(path.join(root, "blogs", "index.html"), "utf8");
  const chinese = fs.readFileSync(path.join(root, "zh", "blogs", "index.html"), "utf8");
  const article = fs.readFileSync(path.join(root, "blogs", "posts", "demo", "index.html"), "utf8");
  assert.match(english, /Featured Writing/);
  assert.match(english, /中文索引/);
  assert.match(chinese, /精选文章/);
  assert.match(chinese, /English index/);
  assert.match(article, /English Title/);
  fs.rmSync(root, { recursive: true, force: true });
});
