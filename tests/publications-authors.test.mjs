import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../publications/index.html", import.meta.url), "utf8");

test("only Chen, B. is bold in journal and international conference author lists", () => {
  const journalStart = html.indexOf('<h3 class="publication-subheading">Journal Articles</h3>');
  const conferenceStart = html.indexOf('<h3 class="publication-subheading">International Conference</h3>');
  const continuationStart = html.indexOf('<div class="publication-year publication-card-section">', conferenceStart);

  assert.ok(journalStart >= 0, "Journal Articles section should exist");
  assert.ok(conferenceStart > journalStart, "International Conference section should follow journal articles");
  assert.ok(continuationStart > conferenceStart, "Featured publication cards should follow the lists");

  const listMarkup = html.slice(journalStart, continuationStart);
  const boldAuthors = [...listMarkup.matchAll(/<strong>([^<]+)<\/strong>/g)].map((match) => match[1]);

  assert.ok(boldAuthors.length > 0, "The publication lists should contain a bold self-author");
  assert.deepEqual([...new Set(boldAuthors)], ["Chen, B."], "Only Chen, B. should be bold in author lists");
});
