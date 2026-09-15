---
slug: 2026-04-12-git-worktree-venv
date: 2026-04-12
title: Configuring Git Worktrees with Isolated Python Virtual Environments
title_zh: Git Worktree + Python 虚拟环境配置指南
summary: Give every Git worktree its own Python virtual environment to avoid dependency contamination and incorrect import paths.
summary_zh: 为每个 Git worktree 配置独立 Python 虚拟环境，避免依赖污染和错误导入路径。
category: Git and Python
category_zh: Git 与 Python
tags: [Git Worktree, Python, venv, Development Environment]
cover: image/blogs/2026-04-12-git-worktree-venv.png
source_post: 2026-4-12-git-worktree-venv-guide.qmd
---

# Configuring Git Worktrees with Isolated Python Virtual Environments

## Problem Background

When `git worktree` is used for parallel development across branches, each worktree should have its own Python virtual environment.

Sharing a virtual environment across worktrees can cause:

- dependency contamination when branches require different package versions;
- incorrect paths when `pip install -e .` points to another worktree; and
- difficult debugging because imported modules come from the wrong branch.

This guide explains how to configure an independent virtual environment for every worktree.

## Core Principle

> **Use worktrees to isolate code and virtual environments to isolate dependencies.**

Every worktree should have:

- its own code directory;
- its own Python environment; and
- its own dependency state.

## Setup Steps

### Step 1: Enter the New Worktree

```bash
cd /path/to/new/worktree
```

### Step 2: Create an Independent Virtual Environment

```bash
python3.12 -m venv .venv
```

Notes:

- `.venv` is recommended as a hidden, conventional directory name.
- Specify a Python version, such as `python3.12`, to keep environments consistent.

### Step 3: Activate the Virtual Environment

```bash
source .venv/bin/activate
```

Use `direnv` or `autoenv` for automatic activation if desired.

### Step 4: Initialize Dependencies

```bash
# Upgrade pip
python -m pip install -U pip

# Install project requirements
pip install -r requirements.txt

# Install the current project in editable mode
pip install -e .
```

- `-r requirements.txt` installs project dependencies.
- `-e .` installs the current project in editable mode and is the critical step that binds imports to this worktree.

### Step 5: Verify the Environment

Run:

```bash
./.venv/bin/python - <<'PY'
import inspect, your_package_name
from your_package_name.settings import SETTINGS
print(inspect.getfile(your_package_name))
print(SETTINGS.root)
PY
```

Expected results:

- The package path points to the current worktree.
- `SETTINGS.root` points to the current worktree.

For example:

```text
/path/to/new/worktree/your_package_name/__init__.py
/path/to/new/worktree
```

## Troubleshooting

### Problem 1: Imports Point to an Old Worktree

Symptom:

```python
import your_package
print(your_package.__file__)
# /path/to/OLD/worktree/your_package/__init__.py
```

Causes:

- The global Python interpreter was used instead of the virtual environment.
- `.venv` was not activated.

Check:

```bash
which python
# Expected: /path/to/new/worktree/.venv/bin/python
```

Repair:

```bash
source .venv/bin/activate
pip install -e .
```

### Problem 2: `SETTINGS.root` Is Incorrect

Symptom:

```python
print(SETTINGS.root)
# /path/to/OLD/worktree
```

Cause:

- The project was not installed in editable mode, or it was installed from the wrong directory.

Repair:

```bash
pip uninstall your_package
pip install -e .
```

## Best Practices

### 1. Ignore Virtual Environments in Git

Add this to `.gitignore`:

```gitignore
# Python virtual environments
.venv/
venv/
__pycache__/
*.pyc
```

### 2. Activate Automatically with direnv

Install `direnv`:

```bash
# macOS
brew install direnv

# Add to ~/.zshrc or ~/.bashrc
eval "$(direnv hook zsh)"  # Or bash
```

Create `.envrc` at the worktree root:

```bash
echo "source .venv/bin/activate" > .envrc
direnv allow
```

Entering the directory now activates the environment automatically; leaving it deactivates the environment.

### 3. Standardize Initialization with a Script

Create `scripts/init_worktree.sh`:

```bash
#!/bin/bash
# Initialize a virtual environment for a new Git worktree

set -e

echo "Initializing worktree virtual environment..."

# Create the virtual environment
python3.12 -m venv .venv

# Activate it
source .venv/bin/activate

# Upgrade pip
python -m pip install -U pip

# Install dependencies
pip install -r requirements.txt
pip install -e .

# Verify
echo "Verifying environment..."
./.venv/bin/python -c "import your_package; print('OK:', your_package.__file__)"

echo "Initialization complete."
```

Use it with:

```bash
chmod +x scripts/init_worktree.sh
./scripts/init_worktree.sh
```

## Complete Workflow Example

```bash
# 1. Create a new worktree
cd ~/projects/my-project
git worktree add ../my-project-feature feature-branch

# 2. Enter the new worktree
cd ../my-project-feature

# 3. Run the initialization script
./scripts/init_worktree.sh

# 4. Start development
source .venv/bin/activate  # If direnv is not in use
python your_script.py

# 5. Clean up when finished, if appropriate
cd ..
git worktree remove my-project-feature
```

## Summary

Virtual environments are essential infrastructure for multi-branch development with `git worktree`.

| Component | Role | Key configuration |
| --- | --- | --- |
| **git worktree** | Code isolation | Separate directory for every branch |
| **venv** | Dependency isolation | Separate `.venv` in every worktree |
| **pip install -e .** | Path binding | Ensures imports resolve to the current worktree |

**Checklist:**

- [ ] Every worktree has an independent `.venv`.
- [ ] `.venv` is listed in `.gitignore`.
- [ ] The project is installed with `pip install -e .`.
- [ ] The import path points to the current worktree.

Following these practices avoids dependency conflicts and path confusion in parallel branch development.

## References

- [Git Worktree documentation](https://git-scm.com/docs/git-worktree)
- [Python venv documentation](https://docs.python.org/3/library/venv.html)
- [direnv](https://direnv.net/)
