import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url);
const publications = fs.readFileSync(new URL("../publications/index.html", import.meta.url), "utf8");
const scripts = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

const journalPdfs = {
  "late-spring-frost": "2026-agrformet-late-spring-frost.pdf",
  sporascan: "2026-pms-sporascan.pdf",
  "cotton-irrigation": "2026-eja-cotton-irrigation.pdf",
  "alternaria-leaf-blotch": "2025-agrformet-alternaria-leaf-blotch.pdf",
  "apple-disease-suitability": "2025-jop-apple-disease-suitability.pdf",
  "highland-barley-wheat": "2025-atmosphere-highland-barley-wheat.pdf",
  "phenology-model-clustering": "2024-agrformet-phenology-model-clustering.pdf",
  "cropping-intensity": "2024-remote-sensing-cropping-intensity.pdf",
  "calcareous-soil-phosphorus": "2021-water-soil-conservation-calcareous-phosphorus.pdf"
};

const conferenceDois = {
  "ms2-net": "https://doi.org/10.5194/egusphere-egu26-5216",
  "maize-irrigation-fertilization": "https://doi.org/10.5194/egusphere-egu26-6718",
  "sustainable-cotton-irrigation": "https://doi.org/10.5194/egusphere-egu25-12369"
};

const conferenceDetails = {
  "egu25-12227": "https://meetingorganizer.copernicus.org/EGU25/EGU25-12227.html",
  "egu25-12159": "https://meetingorganizer.copernicus.org/EGU25/EGU25-12159.html"
};

test("journal titles and featured publication cards open their corresponding local PDFs", () => {
  for (const [id, filename] of Object.entries(journalPdfs)) {
    assert.match(
      publications,
      new RegExp(`<li id="${id}">[\\s\\S]*?<a class="publication-title" href="\\.\\./pdf/${filename}"`),
      `${id} should link its title to its PDF`
    );
    assert.ok(fs.existsSync(path.join(root.pathname, "pdf", filename)), `${filename} should be included in the site`);
  }

  for (const [id, filename] of Object.entries({
    "late-spring-frost": journalPdfs["late-spring-frost"],
    "alternaria-leaf-blotch": journalPdfs["alternaria-leaf-blotch"],
    "cotton-irrigation": journalPdfs["cotton-irrigation"],
    "phenology-model-clustering": journalPdfs["phenology-model-clustering"]
  })) {
    assert.match(
      publications,
      new RegExp(`<a class="publication-card image-publication-card" href="\\.\\./pdf/${filename}"`),
      `${id} featured card should link to its PDF`
    );
  }
});

test("conference titles use their official DOI destinations", () => {
  for (const [id, doi] of Object.entries(conferenceDois)) {
    assert.match(
      publications,
      new RegExp(`<li id="${id}">[\\s\\S]*?<a class="publication-title" href="${doi}"`),
      `${id} should link to its DOI`
    );
  }
});

test("new EGU25 conference titles use the supplied abstract detail pages", () => {
  for (const [id, url] of Object.entries(conferenceDetails)) {
    assert.match(
      publications,
      new RegExp(`<li id="${id}">[\\s\\S]*?<a class="publication-title" href="${url}"`),
      `${id} should link to its Copernicus abstract page`
    );
  }
});

test("home Featured Papers read-more links open the corresponding PDFs in both languages", () => {
  for (const filename of [
    journalPdfs["late-spring-frost"],
    journalPdfs["alternaria-leaf-blotch"],
    journalPdfs["cotton-irrigation"],
    journalPdfs["phenology-model-clustering"]
  ]) {
    const expected = `readMore: "pdf/${filename}"`;
    const count = scripts.split(expected).length - 1;
    assert.equal(count, 2, `${filename} should be used by English and Chinese featured-paper dialogs`);
  }
});

test("the latest frost-risk paper uses its supplied thumbnail in both home languages and news", () => {
  assert.match(publications, /id="late-spring-frost"[\s\S]*?late-spring-frost\.png/);
  assert.match(scripts, /"late-spring-frost"[\s\S]*?late-spring-frost\.png/);

  for (const filename of ["index.html", "zh/index.html", "news/index.html"]) {
    const html = fs.readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.match(html, /late-spring-frost\.png/, `${filename} should use the new supplied thumbnail`);
  }
});
