---
slug: 2026-09-02-codex-agriculture-research-skills
date: 2026-09-02
title: A Codex Skill Toolkit for Agricultural Research: Remote Sensing, Modeling, Figures, and Literature
title_zh: Codex 农业科研 Skill 工具箱：遥感 GIS、建模分析、论文图件与文献写作
summary: A practical reference for selecting and combining 13 Codex skills for agricultural remote sensing, modeling, figures, literature search, and scientific writing.
summary_zh: 面向农业遥感、建模、图件、文献与写作的 13 个 Codex Skill 选择与组合速查手册。
category: Research Workflow
category_zh: 科研工作流
tags: [Codex, Agent Skills, Remote Sensing, GIS, Data Analysis, Scientific Writing]
cover: image/blogs/2026-09-02-codex-agriculture-research-skills.png
source_post: 2026-9-2-codex-agriculture-research-skills-guide.qmd
---

## The Challenge

Agricultural research routinely spans several distinct workflows: acquiring Sentinel or Landsat imagery, analyzing vectors and rasters, organizing field-trial data, building yield models, creating paper figures, searching literature, and drafting manuscripts.

Codex skills provide task-specific workflows, but a growing skill library produces three common problems:

1. forgetting the exact skill name;
2. not knowing whether overlapping skills should be used alone or together;
3. confusing a workflow instruction with installed Python, GIS, or external-service dependencies.

This guide organizes 13 core skills across spatial remote sensing, agricultural modeling, figures, literature discovery, and scientific writing. It also provides prompts that can be adapted directly.

## Skills Are Workflows, Not Installed Software

A skill consists of SKILL.md plus related scripts, references, and templates. It tells Codex when a workflow applies, what sequence to use, which risks to inspect, and what quality standard to meet.

Installing geomaster does not install GDAL, Rasterio, GeoPandas, Earth Engine, PyTorch, or every spatial package in every project. Likewise, installing a scikit-learn skill does not place scikit-learn in every Python environment. Dependencies still need to be installed, versioned, and locked within the actual project environment.

This separation is beneficial: a skill can be reused globally while project dependencies remain isolated and reproducible.

Codex may infer an applicable skill from a request, but complex tasks benefit from explicit names:

~~~text
Use geomaster, geopandas, and scientific-visualization:
audit the projection of this Sentinel-2 field dataset, calculate NDVI,
summarize by field, and create a publication-ready spatial distribution figure.
~~~

A direct skill invocation is also useful:

~~~text
$paper-lookup Search 2021–2026 studies of rice methane emissions and yield synergies.
Record databases, query strings, dates, DOI, and open-full-text status.
~~~

Do not invoke every skill for every task. Select one primary workflow and add only one to three supporting skills for checking, modeling, or delivery.

## Quick Selection Table

| Current task | Primary skill | Common companion |
|---|---|---|
| Remote sensing, rasters, STAC, GEE, spatial ML | geomaster | geopandas, scientific-visualization |
| Vectors, CRS, joins, overlays, geometry repair | geopandas | geomaster |
| Pre-model data structure and quality inspection | exploratory-data-analysis | statistical-analysis |
| Treatment comparisons, tests, effects, power | statistical-analysis | statsmodels |
| Yield prediction, classification, regression, CV | scikit-learn | exploratory-data-analysis |
| Coefficient inference, GLM, mixed models, ARIMA | statsmodels | statistical-analysis |
| Phenology series, time-series classification, change points | aeon | scikit-learn, geomaster |
| Publication multi-panel figures and delivery audit | scientific-visualization | matplotlib |
| Fine control of axes, layout, artists, formats | matplotlib | scientific-visualization |
| Papers, DOIs, citation links, open access | paper-lookup | academic-research-suite |
| Deep research, review, manuscript or experiment planning | academic-research-suite | paper-lookup, scientific-writing |
| Evidence-grounded drafting and manuscript audit | scientific-writing | scientific-critical-thinking |
| Causal overreach, confounding, bias, evidence strength | scientific-critical-thinking | statistical-analysis, scientific-writing |

## Spatial Remote Sensing: geomaster and geopandas

### geomaster

Geomaster is the broad entrance point for Sentinel, Landsat, MODIS, SAR, hyperspectral data, raster and vector operations, spectral indices, terrain analysis, spatial statistics, point clouds, networks, and geospatial machine learning. It also covers cloud-native workflows such as STAC, Cloud-Optimized GeoTIFF, and Planetary Computer.

Use it when a task combines data acquisition, image processing, and spatial modeling:

~~~text
Use geomaster to design a Sentinel-2 time-series workflow for a rice-growing region.
First verify the data source, cloud mask, spatial resolution, and time window.
Then calculate NDVI and EVI, and return reproducible STAC queries and raster-processing code.
Do not assume all dependencies are installed; report the environment check first.
~~~

### geopandas

GeoPandas focuses on correct Python vector-data analysis. It emphasizes CRS semantics, suitable projections for distance and area, invalid geometry, antimeridian issues, spatial joins, overlay, clip, dissolve, and GeoPackage, Arrow, and PostGIS I/O.

Use it when the central question is whether a vector result is correct:

~~~text
Use geopandas to audit the spatial join between field polygons and sampling points.
Check CRS, coordinate extent, invalid geometry, and duplicate features first.
Use an appropriate projected CRS for area calculation.
Report the audit before modifying or overwriting original data.
~~~

In short, geomaster handles an end-to-end geospatial route; geopandas handles precise vector implementation and correctness checks.

## Agricultural Modeling: From Data Audit to Inference

### exploratory-data-analysis

This skill supports controlled local EDA before modeling: inventories, field types, missingness, outliers, leakage, transformation sensitivity, and analysis-report scaffolds. It does not automatically remove outliers, impute values, normalize data, or overwrite source files.

~~~text
Use exploratory-data-analysis to inspect this rice-yield and greenhouse-gas dataset.
Create a file and field inventory, then report missingness, duplicates, outlier ranges,
potential label leakage, and grouping structure.
Do not impute, drop rows, or modify the source data automatically.
~~~

### statistical-analysis

Use this skill to decide **which statistical method** fits the design. It covers test selection, normality and variance checks, nonparametric alternatives, effects, confidence intervals, power analysis, regression diagnostics, and Bayesian alternatives.

~~~text
Use statistical-analysis to compare yield, CH4, and N2O among irrigation treatments.
Choose tests from the experimental design, check assumptions, and report effect sizes and confidence intervals.
Distinguish statistical significance from agricultural practical significance; do not report p-values alone.
~~~

### scikit-learn

This skill is for predictive supervised learning, clustering, dimension reduction, preprocessing, cross-validation, and hyperparameter selection. Its key safeguards are to put preprocessing inside a Pipeline, fit transforms only on training data, and specify seeds and metrics to reduce data leakage.

~~~text
Use scikit-learn to build a baseline rice-yield prediction model.
Put imputation, categorical encoding, and scaling inside a Pipeline.
Design validation by site and year to avoid spatial and temporal leakage.
Compare a linear baseline with tree models, and save seeds and evaluation metrics.
~~~

### statsmodels

Statsmodels is appropriate where parameter estimates, standard errors, confidence intervals, residual diagnostics, or coefficient tables matter. It includes OLS, WLS, GLM, discrete models, and time series. Prefer it when the goal is explanation and inference rather than predictive accuracy alone.

~~~text
Use statsmodels to analyze yield responses across sites and seasons.
Explain the response distribution and model-family choice; check residuals, heteroscedasticity, and collinearity.
Report coefficients, 95% confidence intervals, and robustness analyses.
If random effects are required, verify support for the intended structure first.
~~~

### aeon

Aeon specializes in time-series machine learning: classification, regression, clustering, forecasting, anomaly detection, segmentation, similarity search, and time-series distances. It is a strong match for crop phenology curves, remote-sensing index series, sensor sequences, and change points.

~~~text
Use aeon to classify phenological stages from multi-field NDVI time series.
Check sequence length, sampling interval, missing observations, and label definitions first.
Establish a simple baseline before time-series algorithms.
Validate by field or year so one field never appears in both training and testing.
~~~

## Publication Figures: scientific-visualization and matplotlib

### scientific-visualization

Scientific-visualization governs how evidence should be communicated: honest encodings, uncertainty and missingness, color and grayscale checks, multi-panel layouts, output dimensions, metadata, and journal-targeted export checks. It should not hide points, connect missing observations, or alter data merely to make a figure prettier.

~~~text
Use scientific-visualization to redesign this treatment-effect figure.
Target a double-column multi-panel figure; preserve individual observations, sample sizes,
uncertainty, and missing-data information. Check color-blind and grayscale legibility.
Export SVG, PDF, and 600-dpi PNG, then read them back to verify dimensions and fonts.
~~~

### matplotlib

Matplotlib provides implementation control: Figure and Axes objects, subplot mosaic, GridSpec, axes, annotations, legends, styles, and PNG/PDF/SVG export. Prefer the object-oriented interface for complex figures and keep data calculations separate from plotting functions.

~~~text
Use matplotlib with the object-oriented interface to implement this figure.
Separate data calculations from plotting functions, use subplot_mosaic for panels,
standardize fonts, line widths, and colors, and provide a standalone export script.
~~~

Scientific-visualization sets the evidence and delivery standard; matplotlib implements the details.

## Literature and Writing: Discovery, Evidence, and Audit

### paper-lookup

Paper-lookup can query multiple scholarly services for topic search, DOI/PMID/arXiv lookup, citation relations, and open-access locations. It requires recording search terms, databases, dates, identifiers, and result counts. It also checks for silent cases where an HTTP response is successful but the returned content is not.

It does not replace sources such as CNKI or institution-authenticated Web of Science access.

~~~text
Use paper-lookup to search 2020–2026 studies of rice-water management, yield, CH4, and N2O.
Define scope and choose suitable databases; do not query every source indiscriminately.
Deduplicate by DOI and record query, date, database, hit count, and open-full-text status.
Return candidates for my inclusion decision rather than deciding final inclusion yourself.
~~~

### academic-research-suite

This independent research suite routes requests to deep research, manuscript writing, peer review, full research-to-paper workflows, or experimental planning. Use only the appropriate route, rather than loading the entire suite.

~~~text
ars-lit-review: conduct a literature search and evidence synthesis on rice-methane mitigation and yield trade-offs.
First state the research question, search scope, and evidence gaps. Do not invent missing citations.
~~~

~~~text
ars-plan: based on confirmed research questions, result tables, and a literature matrix,
plan the argumentative structure of an agriculture-and-environment manuscript.
~~~

### scientific-writing

Use scientific-writing to draft, revise, and audit text from established evidence. It distinguishes drafting, source verification, and author approval; it checks consistency between methods and results, bindings between citations and claims, reporting standards, author responsibility, AI disclosure, data statements, and open-science content.

~~~text
Use scientific-writing to revise this Results section.
Use only the supplied tables, figures, and verified literature.
Do not add facts or references that do not exist.
Check sample size, units, effect direction, significance, and figure numbers, and mark unverifiable claims as unverified.
~~~

### scientific-critical-thinking

Scientific-critical-thinking assesses study design, confounding, bias, statistical validity, and evidence strength. It is a useful adversarial review step, but it does not replace domain experts or author judgment.

~~~text
Use scientific-critical-thinking to review this claim:
“Intermittent irrigation can always increase yield and reduce greenhouse-gas emissions in every rice-growing region.”
Separate direct evidence, plausible inference, and overreach. Inspect representativeness, confounding, outcome definitions, and alternative explanations.
~~~

## Four Useful Skill Combinations

### Remote-sensing yield prediction

~~~text
Use geomaster, geopandas, exploratory-data-analysis, scikit-learn, and scientific-visualization
to create a Sentinel-2 and meteorological yield-prediction workflow.
Audit spatial extent, time window, CRS, missingness, and leakage first; then build a baseline model.
Finally deliver publication-ready figures with uncertainty and mapped error.
~~~

### Agricultural field-trial analysis

~~~text
Use exploratory-data-analysis, statistical-analysis, statsmodels, and scientific-critical-thinking
for a multi-site, multi-season trial. Preserve raw values and missingness, explain fixed and random effects,
check assumptions, effects, confidence intervals, and limits on external validity.
~~~

### Crop-phenology time series

~~~text
Use geomaster, aeon, scikit-learn, and scientific-visualization to analyze multi-year NDVI or EVI series
and identify key phenological stages. Group validation by year and field; report missing-data treatment,
temporal alignment, baseline performance, generalization error, and failure cases.
~~~

### Literature review and manuscript writing

~~~text
Use paper-lookup, academic-research-suite, scientific-critical-thinking, and scientific-writing.
First build a reproducible search record and candidate-paper table. After I decide abstract and full-text inclusion,
synthesize the evidence and draft the manuscript. Bind every key claim to verified evidence.
~~~

## Inspecting Installation and Version State

Skills are commonly held in a user-level Codex skills directory:

~~~bash
ls ~/.codex/skills
sed -n '1,25p' ~/.codex/skills/geomaster/SKILL.md
sed -n '1,25p' ~/.codex/skills/paper-lookup/SKILL.md
~~~

A bulk presence check for this toolkit:

~~~bash
for skill in \
  geomaster geopandas exploratory-data-analysis statistical-analysis \
  scikit-learn statsmodels aeon scientific-visualization matplotlib \
  paper-lookup academic-research-suite scientific-writing \
  scientific-critical-thinking; do
  test -f "$HOME/.codex/skills/$skill/SKILL.md" \
    && echo "OK  $skill" \
    || echo "MISS $skill"
done
~~~

After skill updates, start a new Codex task so the current list and descriptions enter the session. Do not install every library globally just to satisfy all skill examples. Enter the relevant project and use its dependency manager, such as uv or conda, to install only the needed packages.

## Summary

Remember the 13 skills along four lines:

- **Spatial remote sensing:** geomaster manages the whole geospatial route; geopandas safeguards vector correctness.
- **Agricultural modeling:** exploratory-data-analysis audits data; statistical-analysis selects methods; scikit-learn predicts; statsmodels infers; aeon handles time series.
- **Figures:** scientific-visualization governs evidence expression and audit; matplotlib controls implementation.
- **Literature and writing:** paper-lookup finds evidence; academic-research-suite organizes research; scientific-writing creates the manuscript; scientific-critical-thinking tests the boundary of conclusions.

The everyday rule is simple: choose one primary skill, add a small number of supporting skills, and state inputs, outputs, prohibited actions, and validation requirements in the prompt.

## References

- [Scientific Agent Skills](https://github.com/K-Dense-AI/scientific-agent-skills)
- [Agent Skills specification](https://agentskills.io/)
