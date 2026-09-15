---
slug: 2026-03-04-git-ignore-pyc
date: 2026-03-04
title: Ignoring Python .pyc Files with Git
title_zh: Git 忽略 Python .pyc 编译文件解决方案
summary: A cross-platform .gitignore workflow for hiding Python bytecode and cache directories without deleting local files.
summary_zh: 跨平台配置 .gitignore，隐藏 Python 字节码和缓存目录而不删除本地文件的流程。
category: Git and Python
category_zh: Git 与 Python
tags: [Git, Python, .gitignore, Virtual Environments]
cover: image/blogs/2026-03-04-git-ignore-pyc.png
source_post: 2026-3-4-git_ignore_pyc.qmd
---

# Ignoring Python .pyc Files with Git

## Problem

When `git status` is run in a Python repository, a large number of generated `.pyc` files and `__pycache__` directories can appear as modified or untracked files. These artifacts make version-control output noisy. Permanent `.gitignore` rules keep them out of routine Git status checks.

## Applicable Environment

- Operating systems: Windows (PowerShell), Linux, and macOS
- Git: version 2.0 or later
- Project type: Python project

## Solution

### Locate the Repository Root

Open a terminal and move to the root directory of the Git repository.

```bash
# Windows PowerShell
cd F:\rice_planthoppers_shift

# Linux/macOS
cd /path/to/rice_planthoppers_shift
```

### Create or Edit `.gitignore`

On Windows PowerShell, open the file with Notepad:

```powershell
notepad .gitignore
```

On Linux or macOS, open it with Vim:

```bash
vim .gitignore
```

Add the following rules. They cover the essential Python bytecode exclusions together with common optional exclusions.

```gitignore
# --------------------------
# Python bytecode
# --------------------------
*.pyc
__pycache__/

# --------------------------
# Common Python project exclusions
# --------------------------
*.pyo
*.pyd

# Virtual environments
.venv/
venv/
env/

# Packaging and build outputs
dist/
build/
*.egg-info/

# Test cache
.pytest_cache/

# IDE configuration
.vscode/
```

### Stop Tracking Files That Git Already Knows About

If `.pyc` files or `__pycache__` directories have already been committed, `.gitignore` alone will not stop Git from tracking them. Remove them from the Git index only; this does not remove local files.

```bash
# Remove tracked .pyc files from the index
git rm --cached **/*.pyc

# Remove tracked __pycache__ directories from the index
git rm --cached -r **/__pycache__
```

### Commit the `.gitignore` Rules

Stage and commit the new rules so the entire team receives them.

```bash
git add .gitignore
git commit -m "feat: add .gitignore rules for Python bytecode and __pycache__"
git push origin main
```

### Verify the Result

Run:

```bash
git status
```

Expected result: `.pyc` files and `__pycache__` directories no longer appear under modified or untracked files.
