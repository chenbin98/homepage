---
slug: 2026-04-24-research-git-branch-management
date: 2026-04-24
title: Git Branch Management for Research Projects with Parallel Experiments and AI Collaboration
title_zh: 科研项目 Git 分支管理规范（适用于多实验 + AI 协作）
summary: A research-oriented Git branching convention for parallel experiments, Codex collaboration, worktrees, and reproducible stable releases.
summary_zh: 面向多实验、Codex 协作与 worktree 开发的科研 Git 分支管理规范，确保 main 始终稳定可复现。
category: Git and Research Computing
category_zh: Git 与科研计算
tags: [Git, Research, DevOps, Codex, Worktree, Reproducibility]
cover: image/blogs/2026-04-24-research-git-branch-management.png
source_post: 2026-4-24-research-git-branch-management.qmd
---

## Why Research Projects Need a Branching Convention

Research repositories often have several pressures at once: **parallel experiments** create branch confusion; **AI-assisted programming** makes changes difficult to trace; **multi-device development** can create inconsistent environments; and **paper reproducibility** requires frozen, recoverable results.

Without a convention, the main branch becomes unstable, experiments contaminate one another, AI and manual changes are intermingled, and abandoned branches accumulate. This guide presents a practical Git model designed for research work.

## Design Goals

| Goal | Meaning |
|---|---|
| **Keep main stable** | It should always be deliverable, reproducible, and demonstrable. |
| **Decouple experiments** | Each experiment is independent and does not contaminate others. |
| **Enable fast iteration** | Failed and abandoned experiments are expected and easy to switch away from. |
| **Converge deliberately** | Validated results enter the main line in a controlled order. |

## Core Branches

### 1. main: the stable branch

Use main for the final stable version, papers, reports, and external releases. It must run completely, reproduce key results, contain no temporary cache, log, or checkpoint artifacts, and have a clear README.

> **Principle:** main is the version that can be delivered at any time.

~~~bash
git switch main
python -m pytest tests/
python train.py --config config.yaml
ls -la results/
cat README.md
~~~

### 2. dev: the integration branch

Use dev to consolidate experiment results before they reach main. It may have minor instability, but it must remain operational. Every experiment branch should flow through it:

> **Flow:** experiment → development → main

~~~bash
git switch dev
git pull origin dev
git merge exp/xxx --no-ff
git push origin dev

git switch main
git pull origin main
git merge dev --no-ff
git push origin main
~~~

### 3. release branches: frozen versions

Use names such as:

~~~text
release/paper-v1
release/rebuttal-v1
release/final-model
~~~

A release branch freezes a submission, defense snapshot, or important milestone. Do not add features there; permit only small bug or documentation corrections.

~~~bash
git switch main
git switch -c release/paper-v1
git push origin release/paper-v1
git commit -m "fix: correct figure annotation"
~~~

## Experiment Branches

Use the form:

~~~text
exp/<research-topic>
~~~

For example:

~~~text
exp/m1-dvr-daily-modifier
exp/spatiotemporal-eval
exp/site-year-split
exp/four-model-compare
~~~

Each experiment should be independent, allowed to fail, and kept out of main until it is validated. Avoid maintaining primary logic indefinitely on an experiment branch, pushing directly to main, or combining unrelated experiments in one branch.

Its lifecycle is:

~~~text
create → develop → evaluate → merge or abandon
~~~

## Codex Branches for AI Collaboration

Use a separate branch for agent work:

~~~text
codex/<task-description>
~~~

Examples:

~~~text
codex/fix-rollout-eval
codex/refactor-dataset
codex/add-figure1
~~~

This isolates AI-produced changes, makes code review clear, and enables easy rollback by discarding a branch. The recommended path is:

> **Codex task → experiment → development → main**

~~~bash
# Start from the relevant experiment branch
git switch exp/m1-dvr-daily-modifier
git switch -c codex/fix-rollout-eval

# Review and merge after the agent task is complete
git switch exp/m1-dvr-daily-modifier
git merge codex/fix-rollout-eval --no-ff

# Remove the temporary task branch
git branch -d codex/fix-rollout-eval
git push origin --delete codex/fix-rollout-eval
~~~

## Backup Branches: a Safety Net

Use names such as:

~~~text
backup/main-20260424
backup/exp-m1-before-reset
~~~

Create a backup before a hard reset, force push, large refactor, or replacement of main.

~~~bash
# First preserve a recoverable reference
git branch backup/main-$(date +%Y%m%d)

# Then perform the disruptive operation
git reset --hard HEAD~3

# Recover if needed
git switch main
git reset --hard backup/main-$(date +%Y%m%d)
~~~

> **Warning:** hard reset discards uncommitted changes and rewrites the checked-out state. Verify the branch and save needed work before running it.

## Standard Workflows

### Start an experiment

~~~bash
git switch dev
git pull origin dev
git switch -c exp/my-experiment
~~~

### Merge a completed experiment into dev

~~~bash
git switch dev
git merge exp/my-experiment --no-ff
git push origin dev
~~~

### Promote stable development work to main

~~~bash
git switch main
git pull origin main
git merge dev --no-ff
git push origin main
~~~

### Freeze a paper version

~~~bash
git switch main
git switch -c release/paper-v1
git push origin release/paper-v1
~~~

### Use Codex for a scoped task

~~~bash
git switch exp/my-experiment
git switch -c codex/refactor-dataset
git diff exp/my-experiment...codex/refactor-dataset
git switch exp/my-experiment
git merge codex/refactor-dataset --no-ff
~~~

## Worktree and Environment Rules

Give each task its own branch. Do not ask an agent to edit main directly, and do not share one branch among unrelated tasks. Each worktree should also have its own environment:

~~~bash
git worktree add ../project-exp2 exp/my-experiment
cd ../project-exp2
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
~~~

Avoid shared virtual environments across worktrees: editable installations and generated paths can otherwise couple branches unexpectedly.

## Admission Criteria for main

Before merging to main, confirm that code runs end to end, key experiments are reproducible, data paths are documented, temporary artifacts are absent, and documentation is current.

~~~bash
#!/bin/bash
echo "=== Main branch admission check ==="

echo "1/5 Run tests..."
python -m pytest tests/ -v || exit 1

echo "2/5 Reproduce a key experiment..."
python train.py --config config.yaml --reproduce || exit 1

echo "3/5 Check data paths..."
test -d data/ || echo "Warning: data/ directory is absent"

echo "4/5 Check temporary files..."
git status --porcelain | grep -E "\.(log|cache|pt|pth)$" && exit 1

echo "5/5 Check documentation..."
test -f README.md || exit 1
echo "All checks passed."
~~~

## Branch Cleanup

### Merged branches

~~~bash
git branch -d exp/xxx
git push origin --delete exp/xxx
~~~

### Unmerged but abandoned branches

~~~bash
git branch -D exp/xxx
git push origin --delete exp/xxx
~~~

> **Warning:** force-deleting a branch removes the local reference. Tag or back up work first if it may be useful later.

### Archive before deletion

~~~bash
git tag archive-exp-xxx-$(date +%Y%m%d)
git push origin archive-exp-xxx-$(date +%Y%m%d)
git branch -D exp/xxx
git push origin --delete exp/xxx
~~~

A lightweight cleanup script can list merged experiment and Codex branches and ask for explicit confirmation before deleting them:

~~~bash
#!/bin/bash
echo "=== Clean merged branches ==="
git branch --merged | grep "exp/"
git branch --merged | grep "codex/"

read -p "Delete the branches listed above? (y/N) " confirm
if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    git branch --merged | grep "exp/\|codex/" | xargs git branch -d
    echo "Cleanup complete."
fi
~~~

## Suggested Repository Topology

~~~text
main                          # stable release
dev                           # integration testing

exp/*                         # research experiments
  ├── exp/m1-dvr-daily-modifier
  ├── exp/spatiotemporal-eval
  └── exp/four-model-compare

codex/*                       # isolated AI tasks
  ├── codex/fix-rollout-eval
  └── codex/refactor-dataset

release/*                     # frozen paper milestones
  ├── release/paper-v1
  └── release/rebuttal-v1

backup/*                      # recovery references
  └── backup/main-20260424
~~~

| Branch type | Purpose | Stability |
|---|---|---|
| **main** | Stable version | Highest |
| **dev** | Integration testing | Medium |
| **exp** | Research experiments | Variable |
| **codex** | Isolated AI task work | Variable |
| **release** | Frozen paper version | High |
| **backup** | Recovery reference | Not applicable |

> Do not experiment on main. Do not make experimental branches the main line. Always keep a route back.

## Further Automation

### Pre-push Git hook

~~~bash
#!/bin/bash
# .git/hooks/pre-push
current_branch=$(git symbolic-ref --short HEAD)
if [[ "$current_branch" == "main" ]]; then
    echo "Direct pushes to main are not allowed."
    echo "Merge through dev instead."
    exit 1
fi
~~~

### Git aliases

~~~ini
# ~/.gitconfig
[alias]
    newexp = "!f() { git switch dev && git pull origin dev && git switch -c exp/$1; }; f"
    newcodex = "!f() { git switch -c codex/$1; }; f"
    backup = "!f() { git branch backup/$1-$(date +%Y%m%d); }; f"
    cleanup = "!git branch --merged | grep -E 'exp/|codex/' | xargs git branch -d"
~~~

### Protect the repository with .gitignore

~~~gitignore
*.log
*.cache
*.pt
*.pth
__pycache__/
.pytest_cache/

results/large_*/
checkpoints/
*.zip

!results/small_result.csv
~~~

## References

- [Git documentation: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [Git Worktree documentation](https://git-scm.com/docs/git-worktree)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)

*Originally published April 24, 2026. Tags: Git, research, DevOps, AI collaboration, version control.*
