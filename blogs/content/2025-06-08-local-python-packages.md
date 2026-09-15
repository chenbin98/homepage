---
slug: 2025-06-08-local-python-packages
date: 2025-06-08
title: Installing and Updating Local Python Packages
title_zh: Python 本地包安装与更新指南
summary: A practical workflow for building, installing, updating, and debugging local Python packages with conda and pip.
summary_zh: 使用 conda 与 pip 构建、安装、更新并排查本地 Python 包问题的实用流程。
category: Python
category_zh: Python
tags: [Python, pip, conda, Package Management]
cover: image/blogs/2025-06-08-local-python-packages.png
source_post: 2025-6-8-local_package_install.qmd
---

# Installing and Updating Local Python Packages

This guide explains how to build, install, and update a local Python package, with the `cbgeo` package as an example.

## Standard Installation Workflow

### 1. Build the Package

First, build the package from the base environment in the `cbgeo` directory:

```bash
conda activate base
python setup.py sdist bdist_wheel
```

### 2. Install the Package

Install the generated package with `pip`:

```bash
pip install dist/cbgeo_pkg-0.1.0-py3-none-any.whl
```

### 3. Update the Package

If an installed package needs to be updated, use `--force-reinstall`:

```bash
pip install dist/cbgeo_pkg-0.1.0-py3-none-any.whl --force-reinstall
```

## A Temporary or Development Installation

When a package is needed only temporarily, use the following workflow.

1. Create a new conda environment if needed:

```bash
conda create -n myenv python=3.x
conda activate myenv
```

2. Move to the directory that contains `setup.py`:

```bash
cd path/to/package/directory
```

3. Install directly with `pip`:

```bash
pip install -e .
```

## Notes

- Make sure that `wheel` and `setuptools` are installed.
- Use `-e` for an editable development installation, which is convenient for debugging and iteration.
- Check Python-version compatibility before installing.
- Prefer a virtual environment so that the system Python installation is not affected.

## Common Problems

If installation fails, try the following steps.

1. Clean build files:

```bash
rm -rf build/ dist/ *.egg-info/
```

2. Rebuild and reinstall:

```bash
python setup.py clean --all
python setup.py sdist bdist_wheel
pip install -e .
```
