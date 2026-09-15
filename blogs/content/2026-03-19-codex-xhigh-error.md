---
slug: 2026-03-19-codex-xhigh-error
date: 2026-03-19
title: Fixing the Codex Unknown Variant xhigh Error
title_zh: Codex 报错 unknown variant xhigh 的原因与解决方法
summary: Resolve a Codex CLI startup error caused by an unsupported reasoning-effort value in the local configuration file.
summary_zh: 修复因配置文件含有当前版本不支持的 reasoning effort 值而导致的 Codex CLI 启动错误。
category: Codex Troubleshooting
category_zh: Codex 错误排查
tags: [Codex, Configuration, Troubleshooting, CLI]
cover: image/blogs/2026-03-19-codex-xhigh-error.png
source_post: 2026-3-19-codex-xhigh-error-fix.qmd
---

# Fixing the Codex Unknown Variant xhigh Error

## Symptom

Running `codex` in a terminal can produce the following error:

```text
Error loading configuration: unknown variant `xhigh`, expected one of `minimal`, `low`, `medium`, `high`
in `model_reasoning_effort`
```

This means that Codex read a value of `xhigh` for `model_reasoning_effort`, but the installed CLI version does not support that value.

## Cause

The root cause is a local Codex configuration such as:

```toml
model_reasoning_effort = "xhigh"
```

while the current CLI version supports only:

```toml
minimal
low
medium
high
```

In this environment, `xhigh` cannot be parsed, so startup fails.

### Common Trigger Conditions

- A higher reasoning-effort setting was selected previously in a graphical interface, IDE plugin, or another environment.
- That setting was written to `~/.codex/config.toml`.
- The terminal version of the Codex CLI does not support `xhigh`.
- Every subsequent startup then reports the same error.

## Solution

The repair is straightforward:

1. Back up the original configuration file.
2. Replace every occurrence of `"xhigh"` with `"high"`.
3. Start `codex` again.

### One-Command Workflow

```bash
# 1. Back up the configuration
cp ~/.codex/config.toml ~/.codex/config.toml.bak

# 2. Replace unsupported values
perl -0pi -e 's/"xhigh"/"high"/g' ~/.codex/config.toml

# 3. Start Codex again
codex
```

### What Each Command Does

#### Back Up the Configuration

```bash
cp ~/.codex/config.toml ~/.codex/config.toml.bak
```

This creates a copy of the current configuration so it can be restored if the edit needs to be reversed.

#### Replace Unsupported Values

```bash
perl -0pi -e 's/"xhigh"/"high"/g' ~/.codex/config.toml
```

This edits `~/.codex/config.toml` in place and replaces all occurrences of `"xhigh"` with `"high"`, avoiding a manual line-by-line edit.

## Manual Inspection and Editing

To check whether `xhigh` still exists in the configuration:

```bash
grep -n "xhigh" ~/.codex/config.toml
```

You can also open the file directly:

```bash
code ~/.codex/config.toml
```

Change settings such as:

```toml
model_reasoning_effort = "xhigh"
plan_mode_reasoning_effort = "xhigh"
```

to:

```toml
model_reasoning_effort = "high"
plan_mode_reasoning_effort = "high"
```

## If the Error Appears Again

If `~/.codex/config.toml` has already been changed but the same error persists, another configuration file may exist in the project directory:

```bash
./.codex/config.toml
```

Search both locations:

```bash
grep -Rn 'xhigh' ~/.codex ./.codex 2>/dev/null
```

If project-level configuration also contains `xhigh`, replace it as well.

## Summary

The error does not mean that Codex itself is broken. It means that the configuration contains an unsupported setting:

```toml
model_reasoning_effort = "xhigh"
```

Replacing it with `high` restores compatibility.

### Recommended Final Repair Commands

```bash
cp ~/.codex/config.toml ~/.codex/config.toml.bak
perl -0pi -e 's/"xhigh"/"high"/g' ~/.codex/config.toml
codex
```

## References

- [Codex documentation](https://github.com/openai/codex)
- [Codex configuration guide](https://github.com/openai/codex#configuration)
