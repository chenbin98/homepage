---
slug: 2026-03-16-server-google-access
date: 2026-03-16
title: Restoring Google API and Earth Engine Access from Mainland China Servers
title_zh: 中国大陆服务器访问 Google API 与 Earth Engine 的解决方案
summary: A diagnostic and proxy-based workflow for a mainland-China Ubuntu server that cannot directly reach Google OAuth or Earth Engine services.
summary_zh: 面向无法直连 Google OAuth 和 Earth Engine 的中国大陆 Ubuntu 服务器的诊断与代理配置流程。
category: Cloud and Operations
category_zh: 云计算与运维
tags: [Google Earth Engine, Google API, Proxy, sing-box, Linux, Cloud Server]
cover: image/blogs/2026-03-16-server-google-access.png
source_post: 2026-3-16-server-google-access-fix.qmd
---

# Restoring Google API and Earth Engine Access from Mainland China Servers

## Problem Background

While deploying a service on an Ubuntu 22.04 cloud server in mainland China, Google API and Earth Engine (GEE) endpoints could not be reached.

**Server environment:**

- Cloud platform: Alibaba Cloud ECS
- Region: Southwest China 1 (Chengdu)
- Operating system: Ubuntu 22.04
- Application dependencies: Google OAuth and the Earth Engine API

**Observed symptom:**

```bash
curl https://oauth2.googleapis.com/token
# timeout or connection reset
```

## Diagnosis

### Test GitHub Connectivity

```bash
curl -I https://github.com
```

Result:

```text
HTTP/2 200
```

This result shows that the server can reach some external websites.

### Test Google Connectivity

```bash
curl -I https://google.com
```

Result:

```text
Connection reset / timeout
```

This confirms that the mainland-China server cannot directly reach Google services.

## Solution Strategy

The overall strategy is to deploy a proxy client on the server and forward traffic for Google APIs through a proxy node.

```text
Server
   ↓
Local proxy (sing-box)
   ↓
Proxy node (hysteria2)
   ↓
Google API / GEE
```

## Solution

### 1. Install sing-box

```bash
curl -fsSL https://sing-box.app/install.sh | bash
```

### 2. Configure a Subscription or Outbound

Edit the configuration file:

```bash
nano /etc/sing-box/config.json
```

Add an outbound using the hysteria2 protocol. Replace every placeholder with values from an authorized service provider; never publish an actual subscription token or password.

```json
{
  "outbounds": [
    {
      "type": "hysteria2",
      "tag": "node1",
      "server": "your.server.com",
      "server_port": 443,
      "password": "your_password",
      "tls": {
        "enabled": true,
        "server_name": "your.server.com"
      }
    }
  ]
}
```

> **Security note:** If a subscription token has ever been exposed publicly, regenerate it in the provider console to prevent unauthorized traffic use.

### 3. Start the Service

```bash
# Enable at boot
sudo systemctl enable sing-box

# Start the service
sudo systemctl start sing-box

# Inspect status
sudo systemctl status sing-box
```

### 4. Set System Proxy Variables

```bash
# Add proxy environment variables
echo 'export HTTP_PROXY=http://127.0.0.1:7890' >> ~/.bashrc
echo 'export HTTPS_PROXY=http://127.0.0.1:7890' >> ~/.bashrc

# Apply immediately
source ~/.bashrc
```

### 5. Verify Connectivity

```bash
curl -I https://google.com
```

Successful output may look like:

```text
HTTP/2 200
```

or:

```text
HTTP/2 404
```

A 404 response is not necessarily a failure; it can mean that the API root path has no resource.

### 6. Test Earth Engine

Run an Earth Engine program again:

```bash
python gee_test.py
```

If the following errors no longer occur, the problem has likely been resolved:

- `connection timeout`
- `connection reset`
- `token refresh failed`

## Final Architecture

```text
Application (Python/GEE)
     ↓
HTTP_PROXY (127.0.0.1:7890)
     ↓
sing-box proxy
     ↓
Hysteria2 node
     ↓
Google OAuth / Earth Engine API
```

## Key Components

| Component | Role | Port |
| --- | --- | --- |
| **sing-box** | Proxy client | 7890 |
| **hysteria2** | Proxy protocol | 443 |
| **HTTP_PROXY** | System proxy environment variable | — |

## Common Questions

### Q1: Why does sing-box fail to start?

Check configuration syntax:

```bash
sing-box check -c /etc/sing-box/config.json
```

View service logs:

```bash
sudo journalctl -u sing-box -f
```

### Q2: Why is the proxy slow?

- Check proxy-node load.
- Try another authorized node.
- Check server bandwidth limits.

### Q3: Why can a Python program still not connect?

Confirm that the environment variables are active:

```bash
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

Or set them explicitly in Python:

```python
import os
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:7890'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:7890'
```

### Q4: Why can a Docker container not connect?

**Option 1:** Set the proxy inside the container.

```dockerfile
ENV HTTP_PROXY=http://127.0.0.1:7890
ENV HTTPS_PROXY=http://127.0.0.1:7890
```

**Option 2:** Use host networking.

```bash
docker run --network host your_image
```

## Summary

**Root cause:**

```text
A mainland-China server cannot directly reach Google API endpoints.
```

**Resolution path:**

```text
Deploy a proxy client on the server
→ forward traffic through an authorized node
→ reach Google and GEE endpoints
```

**Key advantages:**

- Stable, high-performance proxy client
- Relatively simple setup
- System-level proxy support for multiple applications
- Friendly to SSH-based server administration

## References

- [sing-box documentation](https://sing-box.app/)
- [Hysteria2 documentation](https://hysteria.network/)
- [Google Earth Engine Python API](https://developers.google.com/earth-engine/tutorials/community/python-users-guide)
- [Alibaba Cloud ECS network configuration](https://help.aliyun.com/document_detail/25473.html)

> This article is a general reference for reaching GEE from a mainland-China server. Ensure that any proxy configuration complies with applicable laws, institutional policy, and service terms.
