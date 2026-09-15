---
slug: 2026-01-04-systemd-venv-nginx
date: 2026-01-04
title: Deploying Python Back-End Services with systemd, venv, and Nginx
title_zh: 后端服务部署：systemd + venv + Nginx
summary: A native Linux deployment workflow for a Python back-end service managed by systemd and exposed through Nginx.
summary_zh: 使用 systemd 管理 Python 后端服务，并通过 Nginx 对外提供访问的原生 Linux 部署流程。
category: Back-End Deployment
category_zh: 后端部署
tags: [Linux, systemd, Nginx, Python, venv]
cover: image/blogs/2026-01-04-systemd-venv-nginx.png
source_post: 2026-1-4-front_and_backend_server.qmd
---

# Deploying Python Back-End Services with systemd, venv, and Nginx

This article records a native deployment workflow for a Python back-end service, using the Rose WeChat Agent project as an example. The approach combines `systemd`, a Python virtual environment, and Nginx.

## Install Dependencies

```bash
sudo apt-get update
sudo apt-get install -y python3-venv python3-pip
```

## Create a Virtual Environment and Install Dependencies

```bash
cd rose-wechat-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
cp .env.example .env
nano .env
```

## Manage the Service with systemd

### Create a Service File

```bash
sudo nano /etc/systemd/system/rose-wechat-agent.service
```

### Example Service File

Adjust the service entry point for the actual project. Using Uvicorn as an entry point is recommended when asynchronous capabilities may be needed later.

```ini
[Unit]
Description=Rose WeChat Agent
After=network.target

[Service]
WorkingDirectory=/path/to/rose-wechat-agent
EnvironmentFile=/path/to/rose-wechat-agent/.env
ExecStart=/path/to/rose-wechat-agent/.venv/bin/python /path/to/rose-wechat-agent/scripts/run_server.py
Restart=always
RestartSec=3
User=www-data

[Install]
WantedBy=multi-user.target
```

## Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rose-wechat-agent
sudo journalctl -u rose-wechat-agent -f
```

## Use Nginx for Reverse Proxying and HTTPS

### Install Nginx

```bash
sudo apt-get install -y nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/grape
```

Add the following to the relevant `server` block:

```nginx
location /rose_wechat_agent/ {
    proxy_pass http://127.0.0.1:18008/;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /rose_wechat_agent;
    proxy_set_header X-Script-Name /rose_wechat_agent;

    proxy_buffering off;
    proxy_read_timeout 3600s;
}
```

## Common Maintenance Commands

- Restart the back-end service: `sudo systemctl restart rose-wechat-agent`
- View the latest service logs: `sudo journalctl -u rose-wechat-agent -n 100 --no-pager`
- Restart Nginx: `sudo systemctl restart nginx`
