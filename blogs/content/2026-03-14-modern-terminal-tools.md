---
slug: 2026-03-14-modern-terminal-tools
date: 2026-03-14
title: A Beginner Guide to Modern Terminal Tools: Ghostty, Yazi, Lazygit, and Zoxide
title_zh: 现代终端工具全家桶：Ghostty + Yazi + Lazygit + Zoxide 新手教程
summary: Install, configure, and combine four modern terminal tools for keyboard-first development on macOS.
summary_zh: 在 macOS 上安装、配置并组合四款现代终端工具，实现键盘优先的高效开发流程。
category: Developer Tools
category_zh: 开发工具
tags: [Terminal, Ghostty, Yazi, Lazygit, Zoxide, Productivity]
cover: image/blogs/2026-03-14-modern-terminal-tools.png
source_post: 2026-3-14-modern-terminal-tools.qmd
---

# A Beginner Guide to Modern Terminal Tools: Ghostty, Yazi, Lazygit, and Zoxide

## Why Use These Tools?

Traditional terminal commands such as `cd`, `ls`, and `git status` are powerful but can feel basic. The four tools in this guide bring GUI-like usability to the terminal while remaining SSH-friendly and lightweight.

**Core advantages:**

- Faster performance through Rust, Zig, Go, and GPU acceleration
- A modern appearance with themes, transparency, and ligature fonts
- A keyboard-first workflow that keeps hands on the keyboard
- Composability through pipes, scripts, and automation

## Tool Overview

| Tool | Category | Role | Replaces or complements |
| --- | --- | --- | --- |
| **Ghostty** | Terminal emulator | Provides the terminal window | iTerm2, Terminal.app |
| **Yazi** | File manager | Browses and manages files | `ls` + `cd` + `cat` |
| **Lazygit** | Git interface | Visualizes Git operations | `git status/diff/add` |
| **Zoxide** | Directory navigation | Learns frequently used directories | `cd` |

## Installation on macOS

### 1. Install Homebrew if Needed

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install All Tools

```bash
# Terminal emulator
brew install --cask ghostty

# Terminal tools
brew install zoxide lazygit yazi

# Font with icon support
brew install --cask jetbrains-mono-nerd-font
```

### 3. Initialize Configuration Directories

```bash
mkdir -p ~/.config/ghostty ~/.config/yazi ~/.config/lazygit
```

## Configuration Details

### Configure Ghostty

Edit `~/.config/ghostty/config`:

```toml
# Font settings
font-family = "JetBrainsMono Nerd Font"
font-size = 13

# Theme: Catppuccin Mocha, a dark low-glare theme
theme = "catppuccin-mocha"
background = "#1e1e2e"
foreground = "#cdd6f4"

# Window settings
initial-window-size = "1200x800"
window-padding-x = 12
window-padding-y = 12
background-opacity = 0.92

# Key bindings
keybind = "cmd+t=new_tab"
keybind = "cmd+w=close"
keybind = "cmd+d=split:right"
keybind = "cmd+shift+d=split:down"
keybind = "cmd+f=show_search"
keybind = "cmd+c=copy_to_clipboard"
keybind = "cmd+v=paste_from_clipboard"
```

**Core shortcuts:**

| Shortcut | Action |
| --- | --- |
| `Cmd+T` | New tab |
| `Cmd+D` | Split right |
| `Cmd+Shift+D` | Split down |
| `Cmd+W` | Close tab |
| `Cmd+Enter` | Toggle full screen |
| `Cmd+F` | Search |
| `Cmd+Plus/Minus` | Change font size |

### Configure Zoxide

Edit `~/.zshrc` or `~/.bashrc`:

```bash
# Initialize zoxide
eval "$(zoxide init zsh)"

# Useful aliases
alias z="z"
alias zi="z -i"  # Interactive selection
```

**Basic usage:**

```bash
# Jump to a directory that matches a keyword
z projects          # Jump to ~/projects or /work/projects
z ai                # Jump to a directory containing "ai"

# Fuzzy matching
z proj/ai           # Match ~/projects/ai-tool

# List all recorded directories
z

# Interactive selection
zi

# Jump and list files
z projects -
```

**Adaptive learning:** Zoxide records frequently visited directories and gives higher priority to locations that are used more often.

### Configure Yazi

Edit `~/.config/yazi/yazi.toml`:

```toml
[manager]
show_hidden = true
sort_by = "alphabetical"
sort_dir_first = true

[preview]
code_syntax_highlight = true
code_max_lines = 1000
image_quality = 75

[opener]
edit = [
  { run = '${EDITOR:-vi} "$@"', block = true, for = "unix" },
]
open = [
  { run = 'open "$1"', for = "macos" },
]
```

**Basic usage:**

```bash
# Start Yazi
y
ya

# Start in a specific directory
y ~/projects
```

**Core shortcuts:**

| Key | Action |
| --- | --- |
| `j/k` | Move down/up |
| `l` | Enter a directory or open a file |
| `h` | Go to the parent directory |
| `Tab` | Switch preview pane |
| `/` | Search files |
| `a` | Create a file or directory |
| `r` | Rename |
| `d` | Delete to trash |
| `c` | Copy |
| `x` | Cut |
| `p` | Paste |
| `.` | Show or hide files |
| `q` | Quit |

**Preview support:**

- Code files: syntax highlighting
- Images: thumbnail previews
- PDFs: first-page previews
- Videos: cover previews

### Configure Lazygit

Edit `~/.config/lazygit/config.yml`:

```yaml
gui:
  theme:
    activeBorderColor:
      - "#89b4fa"
      - "bold"
    selectedLineBgColor:
      - "#313244"

  mouseEvents: true
  showFileTree: true

git:
  autoRefresh: true
  autoRefreshPeriod: 5
```

**Basic usage:**

```bash
# Start from a project directory
cd ~/your-project
lg
lazygit
```

**Interface layout:**

```text
┌─ Files ─────────────┬─ Diff ──────────────┐
│ M src/main.rs       │ @@ -12,7 +12,9 @@   │
│ M Cargo.toml        │  fn main() {        │
│ ? README.md         │ +   // new code     │
│                     │      old code       │
└─────────────────────┴─────────────────────┘
┌─ Branches ──────────┬─ Commits ───────────┐
│ * feature/auth      │ abc123 Add login    │
│   main              │ def456 Fix bug      │
│   develop           │ 789xyz Update deps  │
└─────────────────────┴─────────────────────┘
```

**Core shortcuts:**

| Key | Action |
| --- | --- |
| `j/k` | Move down/up |
| `Space` | Select or deselect a file |
| `a` | Stage a file |
| `c` | Commit |
| `p` | Push |
| `P` | Pull |
| `b` | Switch branch |
| `B` | Create branch |
| `m` | Merge branch |
| `r` | Refresh |
| `q` | Quit |
| `?` | Show the full shortcut list |

**Advanced capabilities:**

- **Partial commits:** stage selected lines only.
- **Interactive rebase:** adjust commit history visually.
- **Conflict resolution:** compare changes side by side and choose the version to retain.
- **Staging-area management:** inspect staged and unstaged changes separately.

## Complete Workflow Examples

### Scenario: Develop and Commit a New Feature

```bash
# 1. Use zoxide to reach a project quickly
z ai-project

# 2. Use yazi to inspect the file structure
y

# 3. Edit code with a preferred editor
code .

# 4. Use lazygit to inspect and commit changes
lg
# → Press Space to select files
# → Press c to enter a commit message
# → Press p to push to the remote

# 5. Inspect logs in a Ghostty split pane
Cmd+D  # Split right
tail -f logs/app.log
```

### Scenario: Work on Multiple Projects in Parallel

```bash
# Ghostty split-pane workflow

# Left: Project A
z project-a
lg

# Right: Project B, created with Cmd+D
z project-b
y

# Bottom: system monitoring, created with Cmd+Shift+D
htop
```

## Common Questions

### Q1: Why does the font look incorrect?

**A:** Install a Nerd Font and set it explicitly:

```toml
font-family = "JetBrainsMono Nerd Font"
```

### Q2: Why are Yazi previews garbled?

**A:** Install `bat` and `ffmpegthumbnailer`:

```bash
brew install bat ffmpeg
```

### Q3: Why are Chinese characters garbled in Lazygit?

**A:** Ensure that the terminal supports UTF-8; Ghostty does by default.

### Q4: Why can Zoxide not find a directory?

**A:** Visit the directory with `cd` a few times first so that Zoxide can learn the location.

## Advanced Tips

### Advanced Zoxide Usage

```bash
# Remove a saved directory record
zoxide remove ~/old-project

# Export saved records
zoxide query --list > directories.txt

# Integrate with Yazi
# ~/.config/yazi/keymap.toml
[[manager.prepend_keymap]]
on   = [ "c", "z" ]
run  = "plugin zoxide"
desc = "Jump to a directory using zoxide"
```

### Recommended Yazi Plugins

```bash
# Install the plugin manager
git clone https://github.com/yazi-rs/plugins.git ~/.config/yazi/plugins

# Recommended plugins
# - zoxide.yazi: directory navigation
# - git.yazi: Git status display
# - full-border.yazi: decorative borders
```

### Lazygit Custom Commands

The following example contains a destructive Git reset. Use it only after confirming that discarding the latest commit is intended and that recoverability has been considered.

```yaml
# ~/.config/lazygit/config.yml
customCommands:
  - key: "<c-r>"
    command: "git reset --hard HEAD~1"
    description: "Discard the most recent commit"
    context: "commits"
    prompts:
      - type: "confirm"
        title: "Confirm reset"
        body: "Discard the most recent commit?"
```

## Summary

This tool combination can substantially improve terminal-based development.

| Tool | Learning curve | Efficiency gain | Recommendation |
| --- | --- | --- | --- |
| Ghostty | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Zoxide | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Lazygit | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Yazi | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Suggested learning path:**

1. **Week 1:** Ghostty and Zoxide, which have the lowest learning curve.
2. **Week 2:** Lazygit for complex Git operations.
3. **Week 3:** Yazi for advanced file management.

**Final goal:** complete development work without taking your hands off the keyboard.

## References

- [Ghostty](https://ghostty.org)
- [Zoxide on GitHub](https://github.com/ajeetdsouza/zoxide)
- [Yazi](https://yazi-rs.github.io)
- [Lazygit on GitHub](https://github.com/jesseduffield/lazygit)
- [Catppuccin](https://catppuccin.com)

*Last updated: 2026-03-14. Tested on macOS 26.3.1 (arm64).*
