---
slug: 2026-04-25-ssh-key-login-debug
date: 2026-04-25
title: Debugging SSH Key Login When the Server Accepts the Key but Still Returns Permission Denied
title_zh: SSH 免密登录失败排查：服务器接受公钥后仍然 Permission denied
summary: A diagnostic workflow for cases where authorized_keys is correct and the server accepts a public key, but the local client cannot complete authentication.
summary_zh: 记录 authorized_keys 正确、服务器接受公钥但本地客户端无法完成认证时的诊断与修复流程。
category: Infrastructure
category_zh: 运维开发
tags: [SSH, OpenSSH, Windows Server, ssh-agent, Public Key Authentication]
cover: image/blogs/2026-04-25-ssh-key-login-debug.png
source_post: 2026-4-25-ssh-key-login-debug.qmd
---

## The Problem

Password login worked, but key-based login to a Windows OpenSSH Server continued to fail. The common first assumptions are an incorrect authorized_keys entry, a copied public key, or bad remote directory permissions. In this case, none of those was the root cause.

The remote server already held the correct public key and sshd accepted it. The local client could not use the matching private key to sign the authentication exchange.

> Seeing “Server accepts key” does not mean login is complete. It means only that the server recognizes the public key; the client must still sign with the corresponding private key.

Real passwords and key material are intentionally omitted here. The diagnostic procedure is reusable.

## Environment

| Item | Value |
|---|---|
| Local system | macOS |
| Local client | OpenSSH |
| Remote system | Windows OpenSSH Server |
| Remote user directory | C:\Users\<user> |
| Goal | Run SSH without entering a password |

For Windows OpenSSH, the usual remote authorized key file is C:\Users\<user>\.ssh\authorized_keys.

## Step 1: Reproduce a Real Public-Key Failure

Do not rely on a normal SSH command because it may silently fall back to password authentication. Disable password and keyboard-interactive methods explicitly:

~~~bash
ssh -vvv \
  -o BatchMode=yes \
  -o PasswordAuthentication=no \
  -o KbdInteractiveAuthentication=no \
  user@192.168.x.x \
  "whoami"
~~~

| Option | Purpose |
|---|---|
| -vvv | Print detailed SSH diagnostics |
| BatchMode=yes | Disallow interactive input; appropriate for real key-login verification |
| PasswordAuthentication=no | Disable password authentication |
| KbdInteractiveAuthentication=no | Disable keyboard-interactive authentication |

If this succeeds, key-based login is working. If it fails, use the verbose log to locate the failed public-key step.

## The Key Observation

~~~text
Offering public key: /Users/.../.ssh/id_ed25519_new ED25519 SHA256:...
Server accepts key: /Users/.../.ssh/id_ed25519_new ED25519 SHA256:...
sign_and_send_pubkey: signing using ssh-ed25519 SHA256:...
No more authentication methods to try.
Permission denied (publickey,password,keyboard-interactive).
~~~

This establishes that the remote authorized_keys file contains the public key, remote sshd permits public-key authentication, and the remote account and path are broadly correct.

Public-key authentication still has another required stage:

1. The client offers a public key.
2. The server recognizes that public key.
3. The client signs authentication data with the matching private key.
4. The server verifies the signature.

A failure after “Server accepts key” directs attention to the usability of the **local private key**.

## Inspect the Local SSH Configuration

First inspect the effective configuration for the target:

~~~bash
ssh -G user@192.168.x.x | sed -n \
  '/^user /p;
   /^hostname /p;
   /^port /p;
   /^identityfile /p;
   /^identitiesonly /p;
   /^pubkeyauthentication /p'
~~~

The relevant result was:

~~~text
identityfile ~/.ssh/id_ed25519_new
pubkeyauthentication true
~~~

Inspect the key directory and the agent:

~~~bash
ls -ld ~/.ssh
ls -l ~/.ssh
ssh-add -l -E sha256
~~~

The agent reported no identities, meaning no private key was loaded.

## Check Whether the Private Key Needs a Passphrase

Test whether the chosen key can be used non-interactively:

~~~bash
ssh-keygen -y -f ~/.ssh/id_ed25519_new
~~~

The result prompted for a passphrase and could not decrypt the private key. The diagnosis was:

> The configured private key was encrypted and required a passphrase, but it was not loaded in ssh-agent. The server could accept the public key while the client could not complete the signature.

## Verify the Remote Side

Check the remote configuration as well, so the conclusion is not based only on local evidence:

~~~powershell
$sshdir = Join-Path $env:USERPROFILE ".ssh"
$ak = Join-Path $sshdir "authorized_keys"

Get-ChildItem -Force $sshdir
Get-Content $ak
icacls $sshdir
icacls $ak
Select-String -Path "$env:ProgramData\ssh\sshd_config" -Pattern "PubkeyAuthentication|AuthorizedKeysFile|PasswordAuthentication|StrictModes"
~~~

The relevant configuration was:

~~~text
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
~~~

Confirm that the public-key fingerprint in authorized_keys matches the local public key. When these checks match, the remote side is not the primary cause.

## Two Repair Paths

### Option 1: Keep the encrypted key and add it to ssh-agent

~~~bash
ssh-add ~/.ssh/id_ed25519_new
ssh-add -l -E sha256
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_new
~~~

On macOS, configure the host as follows if Keychain integration is wanted:

~~~sshconfig
Host 192.168.x.x
  HostName 192.168.x.x
  User user
  IdentityFile ~/.ssh/id_ed25519_new
  AddKeysToAgent yes
  UseKeychain yes
~~~

This preserves passphrase protection but relies on the agent and Keychain.

### Option 2: Use an already usable key

The final repair used an existing local key. Verify and inspect its public key:

~~~bash
ssh-keygen -y -f ~/.ssh/id_ed25519 >/tmp/id_ed25519.pub
ssh-keygen -lf ~/.ssh/id_ed25519.pub -E sha256
cat ~/.ssh/id_ed25519.pub
~~~

Append only that required public key to the remote authorized_keys file, then configure the client:

~~~sshconfig
Host 192.168.x.x
  HostName 192.168.x.x
  User user
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
~~~

IdentitiesOnly is important: it makes the client try only the specified key, avoiding interference from agent identities or default key lists.

## Final Verification

Run the strict test again:

~~~bash
ssh -o BatchMode=yes \
  -o PasswordAuthentication=no \
  -o KbdInteractiveAuthentication=no \
  user@192.168.x.x \
  "whoami"
~~~

A successful verbose log includes:

~~~text
Offering public key: /Users/.../.ssh/id_ed25519 ED25519 SHA256:...
Server accepts key: /Users/.../.ssh/id_ed25519 ED25519 SHA256:...
Authenticated to 192.168.x.x using "publickey".
~~~

## Troubleshooting Checklist

| Step | Command or evidence | Purpose |
|---|---|---|
| Inspect effective configuration | ssh -G user@host | Confirm which key the client really uses |
| Disable password fallback | BatchMode and PasswordAuthentication=no | Avoid a false success via password |
| Review verbose logs | ssh -vvv user@host | Locate failure before or after key acceptance |
| Inspect agent | ssh-add -l -E sha256 | Confirm that the key is loaded |
| Test private-key usability | ssh-keygen -y -f ~/.ssh/key | Detect passphrase or corruption problems |
| Inspect remote key file | authorized_keys | Confirm matching fingerprint |
| Inspect remote sshd | sshd_config | Confirm public-key authentication is permitted |

## Frequent Mistakes

### “Server accepts key” means login should work

No. It confirms public-key recognition only; the client must still sign with its private key. An encrypted, locked, or unavailable private key still causes failure.

### A normal SSH command succeeds, so passwordless login works

Not necessarily. It may have fallen back to password authentication. Verify with batch mode and password authentication disabled.

### Put every local public key in authorized_keys

That can appear to fix the issue, but it is hard to maintain. Instead, specify the intended key per host, add only that key remotely, and set IdentityFile plus IdentitiesOnly.

## Summary

The root cause was not an incorrect remote authorized_keys file. The local SSH configuration pointed to an encrypted private key that required a passphrase and was not loaded into ssh-agent. The server accepted the matching public key, but the client could not sign.

The repair was to use an already usable local key, add its public key remotely, configure the host with IdentityFile and IdentitiesOnly, and validate with BatchMode enabled. The general lesson is simple: when key login fails, verify both the remote authorized key **and** whether the local private key can actually sign.
