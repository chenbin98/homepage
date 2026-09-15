# Blogs authoring guide

The published article source is English-only Markdown under `blogs/content/`. The external source posts at `/Users/binchen/.codex/skills/blog-post-publisher/posts/` are historical references only and must never be modified by this homepage project.

For a new article, copy `blogs/content/_template.md`, write the complete body in English, then set `title_zh`, `summary_zh`, and `category_zh` for the Chinese index. Generate one 16:9 no-text cover at the `cover` path, update `blogs/source-manifest.json` for imported historical content, and rebuild the static site.

```bash
node --test tests/build-blogs.test.mjs
node scripts/build_blogs.mjs
python3 -m http.server 4173
```

Open `http://localhost:4173/blogs/` and `http://localhost:4173/zh/blogs/` before committing generated pages.
