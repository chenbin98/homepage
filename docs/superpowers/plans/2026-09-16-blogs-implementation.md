# Blogs Page and English Article Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual Blogs section to the personal homepage, with 22 migrated English articles, one generated cover per article, and a repeatable static-page build workflow.

**Architecture:** English Markdown files under `blogs/content/` are the only published article source. A dependency-free Node build script uses local Pandoc to render each Markdown body and produces static English detail pages plus English and Chinese indexes; GitHub Pages serves those committed files without a build step. The original Quarto posts remain read-only outside this repository, while their pre-migration SHA-256 values are retained in a manifest for provenance.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in modules, Pandoc, GitHub Pages, built-in image generation tool.

**Spec:** `docs/superpowers/specs/2026-09-16-blogs-design.md`

## Global Constraints

- Do not edit any file under `/Users/binchen/.codex/skills/blog-post-publisher/posts/`.
- Migrate exactly 22 `.qmd` files and exclude `index.qmd`.
- Article body, title, summary, category, and tags must be English; Chinese metadata is used only in the Chinese index.
- Both indexes link to the same English detail page for each article.
- Keep Blogs between Projects and News in all existing primary navigations.
- Generate exactly one 16:9, no-text, no-logo, no-watermark PNG cover per migrated article using the built-in image generator, and keep final assets in `image/blogs/`.
- Do not introduce a GitHub Pages runtime dependency; generated static HTML must be committed.
- Preserve the existing visual system, accessibility attributes, dark mode, responsive layout, logo and footer.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `blogs/content/*.md` | 22 English source articles with bilingual card metadata in frontmatter. |
| `blogs/source-manifest.json` | Original source filename, source SHA-256, migrated slug, date, and generated cover path. |
| `blogs/cover-prompts.json` | Stable, article-specific prompt used to generate every cover. |
| `blogs/index.html` | Generated English index with featured article and year-grouped archive. |
| `zh/blogs/index.html` | Generated Chinese index linking to English article pages. |
| `blogs/posts/<slug>/index.html` | Generated English article pages. |
| `scripts/build_blogs.mjs` | Frontmatter parsing, Pandoc conversion, HTML generation, and page validation entry point. |
| `tests/build-blogs.test.mjs` | Node built-in tests for metadata parsing, sort order, card links, and generated output. |
| `blogs/README.md` | Future English blog authoring and build instructions. |
| `image/blogs/*.png` | 22 final AI-generated cover images. |
| `css/styles.css` | Blogs index and article-page styles based on Projects cards. |
| `index.html`, `zh/index.html`, `about/index.html`, `publications/index.html`, `projects/index.html`, `news/index.html` | Primary navigation updates. |

## Article Registry

Migrate these exact source filenames in descending date order:

1. `2026-9-2-codex-agriculture-research-skills-guide.qmd`
2. `2026-8-12-codex-cli-api-key-isolated-auth.qmd`
3. `2026-5-11-huggingface-ml-intern-research-agent.qmd`
4. `2026-4-26-codex-ssh-windows-wsl.qmd`
5. `2026-4-25-ssh-key-login-debug.qmd`
6. `2026-4-24-research-git-branch-management.qmd`
7. `2026-4-24-drone-rice-growth-stage-inversion.qmd`
8. `2026-4-12-git-worktree-venv-guide.qmd`
9. `2026-4-3-git-worktree-advanced.qmd`
10. `2026-4-1-meteo-data-workflow.qmd`
11. `2026-3-19-codex-xhigh-error-fix.qmd`
12. `2026-3-17-github-connection-fix.qmd`
13. `2026-3-16-server-google-access-fix.qmd`
14. `2026-3-14-modern-terminal-tools.qmd`
15. `2026-3-4-git_ignore_pyc.qmd`
16. `2026-1-4-front_and_backend_server.qmd`
17. `2025-9-27-scientific_paper_abbreviations.qmd`
18. `2025-9-1-geedownloadimages.qmd`
19. `2025-6-13-geedownload.qmd`
20. `2025-6-10-paper_fig_size.qmd`
21. `2025-6-8-local_package_install.qmd`
22. `2025-6-1-machine_leaning_vs_crop_model.qmd`

### Task 1: Establish the content contract and prove source preservation

**Files:**
- Create: `blogs/source-manifest.json`
- Create: `blogs/content/_template.md`
- Create: `blogs/cover-prompts.json`
- Create: `blogs/README.md`
- Test: `tests/build-blogs.test.mjs`

**Interfaces:**
- Produces one manifest object per article: `{sourceFile, sourceSha256, slug, date, cover, title, titleZh}`.
- Produces one frontmatter format consumed by `parsePost(markdownText, sourcePath)`.

- [ ] **Step 1: Capture immutable source hashes without modifying the source directory**

Run:

```bash
SOURCE_POSTS="/Users/binchen/.codex/skills/blog-post-publisher/posts"
find "$SOURCE_POSTS" -maxdepth 1 -name '*.qmd' ! -name 'index.qmd' -print0 | sort -z | xargs -0 shasum -a 256
```

Expected: 22 `SHA256  path` records and no changed source files in `git status --short` for the external blog folder.

- [ ] **Step 2: Write the English source template**

Create `blogs/content/_template.md` with this exact contract:

```markdown
---
slug: yyyy-mm-dd-topic
date: YYYY-MM-DD
title: English article title
title_zh: 中文索引标题
summary: One English sentence for the English card.
summary_zh: 一句中文索引摘要。
category: English category
category_zh: 中文类别
tags: [Tag One, Tag Two]
cover: ../../image/blogs/yyyy-mm-dd-topic.png
source_post: original-source-file.qmd
---

## Introduction

Write the English article body here.
```

- [ ] **Step 3: Write cover prompt metadata for all 22 articles**

Create `blogs/cover-prompts.json` as an array of objects with `slug`, `title`, and `prompt`. Every prompt must begin with this visual direction:

```text
Use case: scientific-educational
Asset type: 16:9 website article cover
Style/medium: clean editorial scientific technology illustration, low-saturation teal, blue, and warm earth tones
Composition/framing: balanced landscape composition with a clear central subject and safe edge margins for responsive card crops
Constraints: no text, no letters, no numbers, no logos, no watermarks, no UI screenshots
```

Then append article-specific subjects, including: crop-model comparison; publication-figure sizing; Earth Engine authentication; local Python package management; global raster downloading; academic abbreviations; systemd/venv/Nginx deployment; modern terminal tools; mainland-China Google API access; GitHub HTTP transport repair; Codex configuration troubleshooting; Python bytecode ignores; Docker meteorological workflows; Git worktrees and virtual environments; UAV rice phenology inference; research branch management; SSH key diagnostics; Codex-to-WSL remote setup; Hugging Face research agent; isolated Codex CLI authentication; and agricultural research skills.

- [ ] **Step 4: Add the source manifest and authoring guide**

Write `blogs/source-manifest.json` with exactly 22 objects and `blogs/README.md` with the commands:

```bash
node --test tests/build-blogs.test.mjs
node scripts/build_blogs.mjs
python3 -m http.server 4173
```

The guide must state that new article bodies are English-only, `title_zh` and `summary_zh` are for the Chinese index only, and original external `.qmd` files must never be edited by this project.

- [ ] **Step 5: Write the failing metadata test**

Create `tests/build-blogs.test.mjs` beginning with:

```js
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
```

- [ ] **Step 6: Run the test to verify it fails before the builder exists**

Run: `node --test tests/build-blogs.test.mjs`
Expected: failure because `scripts/build_blogs.mjs` does not exist or does not export `parsePost`.

- [ ] **Step 7: Commit the content contract**

```bash
git add blogs/source-manifest.json blogs/content/_template.md blogs/cover-prompts.json blogs/README.md tests/build-blogs.test.mjs
git diff --cached --check
git commit -m "feat: add blogs content contract"
```

### Task 2: Build and test the static blog generator

**Files:**
- Create: `scripts/build_blogs.mjs`
- Modify: `tests/build-blogs.test.mjs`

**Interfaces:**
- Consumes `blogs/content/*.md` except `_template.md`.
- Exports `parsePost(markdownText, sourcePath)`, `sortPostsNewestFirst(posts)`, `renderBlogIndex(posts, locale)`, and `buildBlogs({rootDir})`.
- Produces English and Chinese indexes plus one English article page per source file.

- [ ] **Step 1: Extend the failing test with generated-output assertions**

Append:

```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildBlogs } from "../scripts/build_blogs.mjs";

test("buildBlogs writes bilingual indexes that point to one English article", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "blogs-build-"));
  fs.mkdirSync(path.join(rootDir, "blogs", "content"), { recursive: true });
  fs.writeFileSync(path.join(rootDir, "blogs", "content", "sample.md"), `---\nslug: sample\ndate: 2026-09-02\ntitle: Sample English\ntitle_zh: 中文示例\nsummary: English summary.\nsummary_zh: 中文摘要。\ncategory: Research\ncategory_zh: 科研\ntags: [AI]\ncover: ../../image/blogs/sample.png\nsource_post: sample.qmd\n---\n\n## Introduction\n\nText.`);
  buildBlogs({ rootDir });
  const englishIndex = fs.readFileSync(path.join(rootDir, "blogs", "index.html"), "utf8");
  const chineseIndex = fs.readFileSync(path.join(rootDir, "zh", "blogs", "index.html"), "utf8");
  assert.match(englishIndex, /Featured Writing/);
  assert.match(chineseIndex, /精选文章/);
  assert.match(englishIndex, /posts\/sample\//);
  assert.match(chineseIndex, /\.\.\/\.\.\/blogs\/posts\/sample\//);
});
```

- [ ] **Step 2: Implement the parser and renderer with Node built-ins and Pandoc**

Implement `scripts/build_blogs.mjs` so it:

1. splits the frontmatter between the first two `---` markers;
2. parses scalar values and bracketed tag lists into camel-cased fields (`titleZh`, `summaryZh`, `categoryZh`, `sourcePost`);
3. rejects a post with a missing required frontmatter field by throwing `Error("Missing <field> in <sourcePath>")`;
4. sorts posts by descending ISO date;
5. uses `execFileSync("pandoc", ["--from", "markdown", "--to", "html5"], { input: post.body, encoding: "utf8" })` for article body conversion;
6. writes all files using `fs.mkdirSync(path.dirname(outputPath), { recursive: true })` and `fs.writeFileSync(outputPath, html)`;
7. exits with a clear `Pandoc is required to build blogs.` error when Pandoc is unavailable.

Each generated page must include the existing `../css/styles.css` or correctly depth-adjusted equivalent and `../js/main.js` paths, `lang` attributes, skip link, site header, theme toggle, existing Northwest A&F footer, and Blogs navigation state.

- [ ] **Step 3: Run the tests and verify output**

Run: `node --test tests/build-blogs.test.mjs`
Expected: all tests pass.

Then run: `node scripts/build_blogs.mjs`
Expected: it stops with a clear missing-content message until Task 3 adds source articles; it must not create a partial production index.

- [ ] **Step 4: Commit the generator**

```bash
git add scripts/build_blogs.mjs tests/build-blogs.test.mjs
git diff --cached --check
git commit -m "feat: add static blogs generator"
```

### Task 3: Create the 22 English Markdown article sources

**Files:**
- Create: `blogs/content/2025-6-1-machine-learning-vs-crop-model.md`
- Create: 21 additional `blogs/content/*.md` files matching the Article Registry source articles.
- Modify: `blogs/source-manifest.json`

**Interfaces:**
- Consumes the external `.qmd` sources strictly as read-only translation references.
- Produces 22 source files conforming to `_template.md` and one manifest entry for each source.

- [ ] **Step 1: Read and preserve all source material before translation**

For each Article Registry entry, capture its current SHA-256 and text. Preserve command blocks, code identifiers, configuration keys, filenames, URLs, version numbers, and literal error messages verbatim where they are necessary for technical correctness; translate explanatory prose only.

- [ ] **Step 2: Write English frontmatter and full English body for every article**

Create one Markdown file per source article. Every file must contain all template fields and retain the original heading hierarchy. For early 2025 posts without a description, write a concise English summary based only on the article body. Add a Chinese title, Chinese summary, and Chinese category for cards without translating a second article body.

- [ ] **Step 3: Verify article count and exact source coverage**

Run:

```bash
find blogs/content -maxdepth 1 -name '*.md' ! -name '_template.md' | wc -l
node -e 'const m=require("./blogs/source-manifest.json"); console.log(m.length, new Set(m.map(x=>x.sourceFile)).size)'
```

Expected: `22` translated source files, `22 22` manifest counts.

- [ ] **Step 4: Run the sensitive-content and translation integrity checks**

Run:

```bash
rg -n "BEGIN .*PRIVATE KEY|ssh-ed25519 AAAA|ssh-rsa AAAA|password\s*=|token\s*=" blogs/content || true
rg -n "^(title|title_zh|summary|summary_zh|category|category_zh|cover|source_post):" blogs/content/*.md | wc -l
```

Expected: no leaked credentials or private keys; each article has all required metadata labels.

- [ ] **Step 5: Commit translations separately from generated pages**

```bash
git add blogs/content blogs/source-manifest.json
git diff --cached --check
git commit -m "content: add English blog article sources"
```

### Task 4: Generate and integrate 22 article covers

**Files:**
- Create: `image/blogs/<slug>.png` for all 22 slugs.
- Modify: `blogs/source-manifest.json` only if a generated filename differs from its planned `cover` value.

**Interfaces:**
- Consumes `blogs/cover-prompts.json`.
- Produces exactly one selected PNG per article and maps each file to the corresponding Markdown `cover` field.

- [ ] **Step 1: Generate covers with the built-in image generation tool, one article per call**

For each prompt in `blogs/cover-prompts.json`, use a separate built-in image generation call and enforce: 16:9 landscape, no text, no logos, no watermark, no fake interface, balanced center subject, and the shared low-saturation teal/blue/earth palette.

- [ ] **Step 2: Inspect each generated result and copy only the selected final image into the workspace**

Place final images at the exact paths `image/blogs/<slug>.png`. Do not leave a project-referenced image solely under the default generated-image directory. For any image with text, a watermark, an off-topic subject, or poor crop safety, re-generate only that article's image with a targeted correction.

- [ ] **Step 3: Verify cover cardinality and image paths**

Run:

```bash
find image/blogs -maxdepth 1 -name '*.png' | wc -l
node -e 'const fs=require("fs"); const posts=fs.readdirSync("blogs/content").filter(x=>x.endsWith(".md")&&!x.startsWith("_")); for (const p of posts) { const t=fs.readFileSync(`blogs/content/${p}`,"utf8"); const m=t.match(/^cover: (.+)$/m); if (!m || !fs.existsSync(`blogs/${m[1]}`)) throw new Error(p); } console.log("all covers exist")'
```

Expected: `22` and `all covers exist`.

- [ ] **Step 4: Commit selected covers**

```bash
git add image/blogs blogs/cover-prompts.json blogs/source-manifest.json
git diff --cached --check
git commit -m "feat: add blogs cover artwork"
```

### Task 5: Add Blogs navigation and visual styles

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `about/index.html`
- Modify: `publications/index.html`
- Modify: `projects/index.html`
- Modify: `news/index.html`
- Modify: `css/styles.css`

**Interfaces:**
- Adds a `Blogs` / `博客` primary navigation link at `blogs/` or its correct relative path.
- Adds CSS classes consumed by generated index and article markup: `blogs-page`, `blog-stage`, `blog-card-grid`, `blog-card`, `blog-article`, and `blog-article-cover`.

- [ ] **Step 1: Add a failing static-navigation assertion to the Node test**

Add a test which reads all six primary HTML pages and asserts that `Blogs` appears after `Projects` and before `News`; for `zh/index.html`, assert that `博客` appears after `项目` and before `动态`.

- [ ] **Step 2: Add the navigation link consistently**

Use the existing Font Awesome `fa-pen-nib` icon and insert:

```html
<a href="../blogs/"><i class="fa-solid fa-pen-nib" aria-hidden="true"></i><span>Blogs</span></a>
```

Use depth-correct `blogs/` or `../blogs/` links. In `zh/index.html`, use:

```html
<a href="../zh/blogs/"><i class="fa-solid fa-pen-nib" aria-hidden="true"></i><span>博客</span></a>
```

The existing English-only pages retain English navigation labels; no links to nonexistent Chinese variants may be introduced.

- [ ] **Step 3: Add scoped Blogs styles that reuse existing project values**

Append scoped rules that give cards the same border, surface, radius, hover lift, image crop, grid breakpoints, and dark-mode variables as `project-card`. Add `blog-stage-transition` with the existing `project-stage-transition` line treatment. Ensure code blocks use horizontal overflow and article images use `max-width: 100%`.

- [ ] **Step 4: Run navigation and CSS sanity tests**

Run: `node --test tests/build-blogs.test.mjs`
Expected: all tests pass.

Run: `git diff --check -- index.html zh/index.html about/index.html publications/index.html projects/index.html news/index.html css/styles.css`
Expected: no output.

- [ ] **Step 5: Commit navigation and styles**

```bash
git add index.html zh/index.html about/index.html publications/index.html projects/index.html news/index.html css/styles.css tests/build-blogs.test.mjs
git diff --cached --check
git commit -m "feat: add blogs navigation and styles"
```

### Task 6: Generate the bilingual indexes and English detail pages

**Files:**
- Create: `blogs/index.html`
- Create: `zh/blogs/index.html`
- Create: `blogs/posts/<slug>/index.html` for 22 slugs.
- Modify: `scripts/build_blogs.mjs`
- Modify: `tests/build-blogs.test.mjs`

**Interfaces:**
- Consumes 22 content files and their cover paths.
- Produces two indexes and 22 English article pages with valid relative links.

- [ ] **Step 1: Add comprehensive generated-page assertions**

Add tests that build into a temporary root and assert all of the following:

```js
assert.equal(posts.length, 22);
assert.equal(englishIndex.match(/class="blog-card/g).length, 22);
assert.equal(chineseIndex.match(/class="blog-card/g).length, 22);
assert.match(article, /All English posts/);
assert.match(article, /中文博客索引/);
assert.match(article, /<main id="main">/);
```

- [ ] **Step 2: Implement the Projects-inspired index markup**

English output must contain `Featured Writing`, `Writing Continuum`, and `All Posts`. Chinese output must contain `精选文章`, `写作脉络`, and `全部文章`. Use the newest post as the featured card, but include it only once in the overall card count. Group archived cards by `YYYY` and place newest years first.

- [ ] **Step 3: Implement the English article markup**

Each page must have a `<title>` ending in `| Bin Chen`, date and category metadata, a title, summary, cover `<img>`, Pandoc-rendered body, and both index back-links. Use relative asset paths based on `blogs/posts/<slug>/` depth and set `aria-current="page"` on Blogs in the page navigation.

- [ ] **Step 4: Build all static pages and run tests**

Run:

```bash
node --test tests/build-blogs.test.mjs
node scripts/build_blogs.mjs
find blogs/posts -mindepth 2 -maxdepth 2 -name index.html | wc -l
```

Expected: all tests pass and the article-page count is `22`.

- [ ] **Step 5: Parse generated HTML and test local paths**

Run:

```bash
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
for page in [Path('blogs/index.html'), Path('zh/blogs/index.html'), *Path('blogs/posts').glob('*/index.html')]:
    HTMLParser().feed(page.read_text())
print('html parse ok')
PY
```

Then use a local static server and browser to verify that all index card links and cover image responses return HTTP 200.

- [ ] **Step 6: Commit generated static Blogs pages**

```bash
git add blogs/index.html zh/blogs/index.html blogs/posts scripts/build_blogs.mjs tests/build-blogs.test.mjs
git diff --cached --check
git commit -m "feat: publish bilingual blogs pages"
```

### Task 7: Perform source-integrity, visual, and deployment validation

**Files:**
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Interfaces:**
- Consumes final static site, source manifest, external source hashes, and GitHub Pages build status.
- Produces recorded verification evidence and a deployed homepage.

- [ ] **Step 1: Re-check external source hashes**

Run the Task 1 hash command again and compare each record with `blogs/source-manifest.json`. Expected: all 22 SHA-256 values match exactly, proving the original folder was untouched.

- [ ] **Step 2: Inspect responsive rendering**

Open English Blogs, Chinese Blogs, one agricultural AI detail page, and one developer-tool detail page at desktop and a narrow viewport. Confirm readable card titles, non-cropped critical cover content, navigation order, dark mode, language links, code block overflow, and working return links.

- [ ] **Step 3: Run full repository and content checks**

Run:

```bash
node --test tests/build-blogs.test.mjs
git diff --check
git status --short
```

Confirm only approved feature files are staged and no external `posts/` file is modified.

- [ ] **Step 4: Commit verification records and push**

```bash
git add task_plan.md findings.md progress.md
git commit -m "docs: record blogs implementation verification"
git push origin master
```

- [ ] **Step 5: Verify GitHub Pages and live pages**

Run:

```bash
gh api repos/chenbin98/homepage/pages/builds/latest --jq '{status: .status, commit: .commit, updated: .updated_at}'
curl -fsSL https://chenbin98.github.io/homepage/blogs/ | rg "Featured Writing|blog-card"
curl -fsSL https://chenbin98.github.io/homepage/zh/blogs/ | rg "精选文章|blog-card"
```

Expected: Pages status is `built`; both live indexes include their correct headings and 22 cards.

## Plan Self-Review

- **Spec coverage:** Tasks 1–3 preserve and migrate all source content; Task 4 supplies independent generated covers; Task 5 updates navigation and styles; Task 6 creates bilingual indexes and English detail pages; Task 7 validates source integrity, rendering, and deployment.
- **Placeholder scan:** The plan contains no deferred implementation markers. Angle-bracket paths and example dates are explicit filename contracts, not missing content.
- **Interface consistency:** All content flows through `blogs/content/*.md`; `parsePost`, `sortPostsNewestFirst`, `renderBlogIndex`, and `buildBlogs` are named consistently in the tests and generator; all article output paths are `blogs/posts/<slug>/index.html`.
