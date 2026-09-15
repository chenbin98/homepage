import assert from "node:assert/strict";
import test from "node:test";
import { parsePost, sortPostsNewestFirst } from "../scripts/build_blogs.mjs";

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
