---
slug: 2026-04-26-codex-ssh-windows-wsl
date: 2026-04-26
title: Connecting Codex App to Windows Server over SSH through WSL
title_zh: Codex App 通过 SSH 连接 Windows Server：WSL 方案完整指南
summary: A practical WSL bridge for running Codex Remote on a Windows Server, including SSH service setup, port forwarding, key authentication, and troubleshooting.
summary_zh: 通过 WSL 将 Codex Remote 接入 Windows Server，涵盖环境安装、端口转发、SSH 免密配置与排错。
category: AI Tools and Infrastructure
category_zh: AI 工具与运维
tags: [Codex, SSH, Windows, WSL, Remote Development]
cover: image/blogs/2026-04-26-codex-ssh-windows-wsl.png
source_post: 2026-4-26-codex-ssh-windows-wsl.qmd
---

## The Compatibility Problem

Codex App can connect to remote machines through SSH for AI-assisted coding. Connecting directly to a Windows Server can fail even when ordinary SSH works: Codex may report that /bin/sh -lc cannot execute; SSH opens a PowerShell session, but Codex Remote cannot start; and the Codex command can work in Windows PowerShell while remote startup still fails.

The core question is how to run a tool that relies on a Linux shell on Windows Server. This guide uses placeholders for all hosts, users, and addresses.

## Why Direct Windows SSH Is Not Enough

Codex Remote runs remote commands in a Unix-like shell:

~~~bash
/bin/sh -lc "codex ..."
~~~

Windows PowerShell and cmd use different shells, startup files, paths, environment-variable syntax, and process conventions.

| Dimension | Linux / WSL | Windows |
|---|---|---|
| Default shell | /bin/bash or /bin/sh | powershell.exe or cmd.exe |
| Startup files | ~/.bashrc and ~/.profile | $PROFILE and Registry |
| Paths | /home/user/... | C:\Users\... |
| Variables | export VAR=value | $env:VAR="value" |

A successful SSH login into Windows therefore does not supply the Unix environment required by Codex. WSL is a natural bridge.

## Architecture

~~~text
Mac Codex App
    ↓ SSH, port 2222
Windows Server
    ↓ port forwarding
WSL Ubuntu, running Codex
~~~

SSH reaches Windows and is forwarded into Ubuntu in WSL, where Codex runs in its required Linux environment.

## Step 1: Install WSL

In Windows PowerShell:

~~~powershell
wsl --install -d Ubuntu
~~~

Restart when prompted and set the Linux username and password at the first launch. WSL 2 is recommended:

~~~powershell
wsl --set-version Ubuntu 2
~~~

## Step 2: Install the WSL Environment

Inside the WSL terminal:

~~~bash
sudo apt update
sudo apt install -y openssh-server curl

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc

nvm install --lts
npm i -g @openai/codex
codex --version
~~~

## Step 3: Configure the WSL SSH Service

Use a separate SSH port to avoid clashing with the Windows SSH service:

~~~bash
sudo sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo service ssh restart
hostname -I
~~~

Record the WSL IP address returned by hostname -I. WSL 2 addresses can change after restart.

## Step 4: Forward the Port through Windows

Run PowerShell as Administrator and forward Windows port 2222 to WSL port 2222:

~~~powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=2222 connectaddress=<WSL_IP> connectport=2222
New-NetFirewallRule -DisplayName "WSL SSH 2222" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 2222
~~~

Replace the WSL IP placeholder with the address retrieved in the previous step. Recreate this mapping if WSL receives a new address after restart.

## Step 5: Configure SSH on macOS

Add a host entry in the local SSH configuration:

~~~sshconfig
Host win-wsl
    HostName 192.168.x.x
    User <windows_user>
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
~~~

| Setting | Meaning |
|---|---|
| HostName | Windows Server address |
| User | Corresponding WSL user |
| Port | 2222, matching the forwarding rule |
| IdentityFile | Local private-key path |

## Step 6: Enable Key-Based Login

Copy the public key to the WSL account:

~~~bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 <user>@192.168.x.x
ssh win-wsl
~~~

The first command adds the key to the WSL user authorized_keys file. The second should open WSL without prompting for a password.

## Step 7: Add the Remote Host in Codex App

Use a remote connection with:

| Field | Value |
|---|---|
| Display Name | win-wsl |
| Host | <user>@192.168.x.x |
| Port | 2222 |

Use native WSL paths such as /home/<user>/workshop/your_project when adding a project. A mounted Windows path such as /mnt/d/your_project also works, but native WSL storage is generally faster.

## Step 8: Verify

~~~bash
ssh win-wsl
codex --version
~~~

When both succeed, start the Remote connection in Codex App.

## Troubleshooting

### Connection refused

Check the Windows port-proxy and firewall rules:

~~~powershell
netsh interface portproxy show all
Get-NetFirewallRule -DisplayName "WSL SSH 2222"
~~~

Then check SSH inside WSL:

~~~bash
sudo service ssh status
~~~

### SSH still asks for a password

Ensure that the intended public key is in the WSL authorized_keys file and that the private key is available locally:

~~~bash
ssh-add -l
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/authorized_keys
~~~

### Codex command not found after SSH login

The usual cause is that nvm is not initialized in a non-interactive shell. Put its initialization in a login startup file such as ~/.profile or ~/.bash_profile:

~~~bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
~~~

Codex invokes /bin/sh -lc, so the login-shell PATH must include Node and Codex.

### WSL IP changes after restart

Delete the stale port proxy and recreate it with the new WSL IP:

~~~powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=2222
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=2222 connectaddress=<NEW_WSL_IP> connectport=2222
~~~

## Key Takeaways

1. Codex Remote requires a Linux-style shell; PowerShell cannot replace /bin/sh -lc.
2. WSL provides the Linux bridge on Windows Server.
3. Port forwarding carries external SSH traffic from Windows to WSL.
4. Passwordless SSH is required for unattended remote operation.
5. The PATH, including nvm-based Node installations, must be available in a non-interactive login shell.

This pattern is useful for teams that have Windows servers but need Linux-dependent AI coding tools, unified Linux tooling, or a remote development environment. For more complex situations, consider WSL mirrored networking, a Linux virtual machine, or a fixed-IP maintenance script.

## References

- [Codex Remote Connections](https://developers.openai.com/codex/remote-connections)
- [Codex CLI documentation](https://developers.openai.com/codex/cli)
- [Codex on Windows](https://developers.openai.com/codex/windows)
- [WSL documentation](https://learn.microsoft.com/en-us/windows/wsl/)
