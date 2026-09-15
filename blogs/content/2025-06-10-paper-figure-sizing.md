---
slug: 2025-06-10-paper-figure-sizing
date: 2025-06-10
title: A Guide to Publication Figure Sizes in Python
title_zh: Python 论文图片尺寸规范指南
summary: Recommended figure dimensions, resolution, formats, typography, and Python settings for publication-ready academic graphics.
summary_zh: 面向学术投稿图件的尺寸、分辨率、格式、字体与 Python 设置建议。
category: Data Visualization
category_zh: 数据可视化
tags: [Python, Scientific Writing, Data Visualization, Figure Size]
cover: image/blogs/2025-06-10-paper-figure-sizing.png
source_post: 2025-6-10-paper_fig_size.qmd
---

# A Guide to Publication Figure Sizes in Python

In academic writing, figure dimensions are essential to page layout and publication quality. This guide summarizes figure-size conventions used by Elsevier and shows how to set those dimensions in Python.

## Elsevier Figure-Size Conventions

| Use | Width × height (inches) | Notes |
| --- | --- | --- |
| Single-column figure | 3.5 × 2.5 | Common for illustrations and simple figures |
| One-and-a-half-column figure | 4.75 × 3.5 | Suitable for moderately complex figures |
| Full-width figure | 6.89 × 4.5 | Recommended for double-column figures or main figures |
| Wide landscape figure | 6.89 × 2.5 | Common for time series and other wide figures |

## Setting Figure Sizes in Python

### Using Matplotlib

```python
import matplotlib.pyplot as plt

# Set figure size in inches
plt.figure(figsize=(3.5, 2.5))  # Single-column figure
# Or
plt.figure(figsize=(6.89, 4.5))  # Full-width figure
```

### Using Seaborn

```python
import seaborn as sns

# Set figure size
plt.figure(figsize=(3.5, 2.5))
sns.set(rc={'figure.figsize': (3.5, 2.5)})
```

## Additional Considerations

1. **Resolution**
   - Use 300 DPI or higher whenever possible.
   - Specify resolution when saving: `plt.savefig('figure.png', dpi=300)`.

2. **File formats**
   - PDF or EPS is recommended for vector graphics.
   - High-resolution PNG is also suitable when raster output is required.

3. **Font sizes**
   - Title: 12–14 pt
   - Axis labels: 10–12 pt
   - Legend: 10 pt
   - Tick labels: 8–10 pt

## Example Code

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Set figure size and style
plt.figure(figsize=(6.89, 4.5))  # Full-width figure
sns.set_style("whitegrid")
sns.set_context("paper", font_scale=1.2)

# Draw the figure
# ... your plotting code ...

# Save the figure
plt.savefig('figure.pdf',
            dpi=300,
            bbox_inches='tight',
            pad_inches=0.1)
```

## Common Problems

1. **Blurry figures**
   - Check the DPI setting.
   - Use a vector format such as PDF or EPS.
   - Make sure the original data and raster assets have sufficient resolution.

2. **Figures that are too large**
   - Use `bbox_inches='tight'` to trim margins automatically.
   - Adjust `pad_inches` when necessary.

3. **Unclear text**
   - Adjust font sizes with `plt.rcParams['font.size']`.
   - When Chinese text is required, use a font that supports Chinese characters, such as SimHei.
