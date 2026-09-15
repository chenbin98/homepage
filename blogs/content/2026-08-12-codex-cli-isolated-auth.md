---
slug: 2026-08-12-codex-cli-isolated-auth
date: 2026-08-12
title: Keep Codex App on ChatGPT While Using an API Key in an Isolated Codex CLI
title_zh: Codex App 保持 ChatGPT 订阅登录，同时让 Codex CLI 使用 API Key
summary: Use an isolated CODEX_HOME for API-key CLI authentication without replacing the ChatGPT subscription login used by Codex App and the default CLI.
summary_zh: 通过独立 CODEX_HOME 隔离 API Key 版 CLI 认证，避免覆盖 Codex App 与默认 CLI 的 ChatGPT 订阅登录。
category: AI Tools
category_zh: AI 工具
tags: [Codex, Codex CLI, ChatGPT, OpenAI API, Authentication, CODEX_HOME]
cover: image/blogs/2026-08-12-codex-cli-isolated-auth.png
source_post: 2026-8-12-codex-cli-api-key-isolated-auth.qmd
---

## The Requirement

Codex supports two primary authentication paths:

- sign in with a ChatGPT account and use the Codex access included in the relevant ChatGPT plan;
- sign in with an OpenAI API key and pay through the OpenAI Platform API account.

A common requirement is to keep Codex App on an already authorized ChatGPT subscription while using an API key in the terminal. When reauthorization requires an administrator or another person, the requirement is not merely to be able to switch back: changing the CLI must **not disturb the protected existing login**.

A direct default-profile sequence can be risky:

~~~bash
codex logout
printenv OPENAI_API_KEY | codex login --with-api-key
~~~

The issue is not billing conflict. Default clients can share authentication state. Logging out clears that default state, and API-key login can replace it. Even if the app looks signed in immediately, a restart or credential refresh can expose the disruption.

The conservative approach is to give the API-key CLI an independent CODEX_HOME so it has separate authentication and configuration, while the default profile is left untouched.

## Authentication and Local State

| Sign-in method | Access and billing |
|---|---|
| ChatGPT sign-in | ChatGPT subscription access and plan allowance |
| API key sign-in | OpenAI Platform account and standard API pricing |

API-key authentication is useful for local CLI and automation. Some features dependent on the ChatGPT workspace or cloud may be unavailable. The important technical issue is where credentials are stored.

The Codex CLI and IDE integration can share cached login state. Authentication commonly resides in the operating-system credential store or in the default Codex directory, including an auth.json file. A practical local check showed that a fresh, separate CODEX_HOME reported “Not logged in” while the default ChatGPT profile continued to report “Logged in using ChatGPT.”

The safety conclusion is simple: do not assume the app and default CLI are completely independent when the account is costly to reauthorize. Isolate the second login deliberately.

## Why CODEX_HOME Works

CODEX_HOME selects the Codex working directory. The default is the standard Codex profile directory; a different value causes Codex to create and use separate authentication and configuration there.

Do not copy or symlink an OAuth auth file between profiles. Refresh tokens can become invalid or create confusing state. Instead, sign in independently with the API key in the new profile.

## Safe Setup Procedure

### 1. Verify the protected default login first

~~~bash
codex login status
~~~

The expected result is a ChatGPT login. If not, stop and establish the current state before doing anything else.

### 2. Create a dedicated API-key profile directory

~~~bash
mkdir -p "$HOME/.codex-api"
~~~

The intended separation is:

~~~text
~/.codex       → existing ChatGPT subscription login
~/.codex-api   → isolated API-key CLI login
~~~

### 3. Read the API key safely and log in only in the isolated profile

Do not place a real API key in a command line, source file, or shell history. Use hidden interactive input:

~~~bash
read -s "CODEX_API_KEY?Enter OpenAI API Key: "
echo

printf '%s' "$CODEX_API_KEY" |
  env CODEX_HOME="$HOME/.codex-api" codex login --with-api-key

unset CODEX_API_KEY
~~~

The important rule is that every API-key authentication command is prefixed by the isolated CODEX_HOME. Removing the temporary environment variable does not remove the login saved in the isolated profile.

### 4. Verify both profiles independently

~~~bash
env CODEX_HOME="$HOME/.codex-api" codex login status
codex login status
~~~

The first should report an API-key login; the second should still report a ChatGPT login. Both checks must pass before treating the isolation as complete.

### 5. Start the API-key CLI explicitly

~~~bash
env CODEX_HOME="$HOME/.codex-api" codex
~~~

Running plain Codex without the environment override remains in the default authentication profile and normally continues to use the ChatGPT subscription.

### 6. Make the safe command hard to mistype

Add a zsh helper:

~~~bash
codex-api() {
  CODEX_HOME="$HOME/.codex-api" command codex "$@"
}
~~~

Reload the shell configuration and use:

~~~bash
source "$HOME/.zshrc"
codex-api
codex-api login status
~~~

| Use | Command | Authentication and billing |
|---|---|---|
| Codex App | Open normally from the desktop | Existing ChatGPT subscription |
| Default terminal CLI | codex | Default ChatGPT profile |
| API-key terminal CLI | codex-api | Isolated API-key profile and API billing |

### 7. Log out only from the API-key profile

If the API-key login must be removed later, explicitly select its profile:

~~~bash
env CODEX_HOME="$HOME/.codex-api" codex logout
~~~

Do not run a plain logout command unless the default ChatGPT authentication is intended to be removed.

## Stronger Isolation Options

An independent CODEX_HOME separates Codex configuration and authentication files. When reauthorization is extremely difficult or organization-level isolation is necessary, put the API-key CLI in a separate macOS user account, Docker container, virtual machine, or remote host. Those alternatives also separate operating-system credential stores and process environments.

## Summary

ChatGPT and API-key sign-ins do not conflict as billing methods, but switching the default Codex profile can overwrite shared local state. The robust design is:

~~~text
Default Codex profile      → preserve ChatGPT subscription login
Independent Codex profile  → use API-key CLI authentication
~~~

Follow four rules:

1. run login-status checks before changing authentication;
2. never log out or perform API-key login in the default profile when it must be protected;
3. assign a separate CODEX_HOME to the API-key CLI;
4. verify both profiles separately after login.

The point is not to recover a protected login later; it is to avoid changing it in the first place.

## References

- [Codex authentication](https://learn.chatgpt.com/docs/auth)
- [OpenAI Codex repository](https://github.com/openai/codex)
- [Independent CODEX_HOME authentication profiles](https://github.com/openai/codex/issues/15410)
