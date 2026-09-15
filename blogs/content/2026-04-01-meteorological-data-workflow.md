---
slug: 2026-04-01-meteorological-data-workflow
date: 2026-04-01
title: A Standard Meteorological Data Workflow with Docker, OpenAPI, and AI Automation
title_zh: 气象数据服务标准使用流程：Docker + OpenAPI + AI 自动化
summary: Deploy a local meteorological data service with Docker, retrieve its OpenAPI contract, and use AI to create reusable client code.
summary_zh: 使用 Docker 部署本地气象数据服务、获取 OpenAPI 契约，并借助 AI 生成可复用调用代码的流程。
category: Data Engineering
category_zh: 数据工程
tags: [Docker, OpenAPI, AI, Meteorological Data, Automation, Python]
cover: image/blogs/2026-04-01-meteorological-data-workflow.png
source_post: 2026-4-1-meteo-data-workflow.qmd
---

# A Standard Meteorological Data Workflow with Docker, OpenAPI, and AI Automation

## Introduction

Obtaining meteorological data is a common requirement in research and data-analysis projects. Repeatedly reading documentation, writing client code, and debugging interfaces by hand is inefficient.

This article presents a standardized workflow: deploy a service locally with Docker, retrieve the API contract from OpenAPI, and use AI to generate client code. The workflow removes the need to memorize an API and can be reused quickly in every new project.

## Core Architecture

```text
Docker container                OpenAPI contract                AI code generation
meteo-data-download:8000  →    openapi.json              →    Python script
```

**Key principles:**

- Do not depend on `/docs`, which is designed for people rather than automation.
- Use `openapi.json`, a machine-readable standard.
- Repeat the same workflow for every new project.
- Do not memorize APIs; follow the standard process.

## Prerequisites

### Environment requirements

- Docker is installed and running.
- Python 3.8 or later is available.
- `curl` or `wget` is available.
- An AI assistant is available for code generation.

### Service endpoints

| Item | Value |
| --- | --- |
| Local service | `http://127.0.0.1:8000` |
| OpenAPI definition | `http://127.0.0.1:8000/openapi.json` |
| Documentation page | `http://127.0.0.1:8000/docs` (reference only) |

## Standard Workflow

### Step 1: Check Whether the Docker Service Is Running

```bash
docker ps | grep meteo-data-download
```

If it is running, continue. Otherwise start it:

```bash
# Existing container
docker start meteo-data-download

# Or first run
docker run -d -p 8000:8000 --name meteo-data-download your-image
```

### Step 2: Retrieve the API Contract

In every new project, create an `api` directory and download the OpenAPI definition:

```bash
mkdir -p api && curl -s http://127.0.0.1:8000/openapi.json -o ./api/openapi.json
```

**Why this step matters:**

- The OpenAPI contract contains complete endpoint definitions.
- AI can use it to generate accurate calling code.
- It avoids mistakes caused by manually reading documentation.

### Step 3: Ask AI to Write Code from the Contract

Give the AI the following information:

1. Local service address: `http://127.0.0.1:8000`
2. Contract file: `./api/openapi.json`
3. A user requirement, such as downloading meteorological data for a specified area and time range.

Use this prompt template:

```text
This project needs to call a local meteorological service.

Service address:
http://127.0.0.1:8000

API definition file:
./api/openapi.json

Please complete the following tasks:
1. Read ./api/openapi.json first and identify available endpoints, parameters, and response structures.
2. Use the real interface to write code that downloads meteorological data.

Requirements:
- Follow the interfaces in openapi.json exactly; do not assume undocumented endpoints.
- Use Python.
- Package the logic as a reusable function or class.
- Write all comments in English.
- Include error handling and timeouts.
- Provide a minimal runnable example.
```

### Step 4: Run the AI-Generated Code

AI can produce code similar to the following:

```python
import requests
import json
from typing import Dict, Any

class MeteoDataClient:
    """Client for downloading meteorological data from local Docker service."""

    def __init__(self, base_url: str = "http://127.0.0.1:8000", timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()

    def download_weather_data(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        variables: list[str]
    ) -> Dict[str, Any]:
        """
        Download weather data for specified location and time range.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            variables: List of weather variables to download

        Returns:
            Dictionary containing weather data

        Raises:
            requests.exceptions.RequestException: If API call fails
        """
        endpoint = f"{self.base_url}/api/download"
        payload = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "variables": variables
        }

        response = self.session.post(
            endpoint,
            json=payload,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    client = MeteoDataClient()

    try:
        data = client.download_weather_data(
            latitude=39.9042,
            longitude=116.4074,
            start_date="2026-01-01",
            end_date="2026-01-31",
            variables=["temperature", "humidity", "precipitation"]
        )

        with open("weather_data.json", "w") as f:
            json.dump(data, f, indent=2)

        print(f"Downloaded {len(data.get('results', []))} records")

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
```

Run the generated code to obtain meteorological data. Results can be saved as CSV or JSON, expanded to batch downloads, or integrated into an existing data-processing workflow.

## Example Project Structure

```text
my-research-project/
├── api/
│   └── openapi.json          # Retrieved from the local service
├── scripts/
│   └── download_weather.py   # AI-generated download script
├── data/
│   └── weather_data.json     # Downloaded meteorological data
└── README.md
```

## Common Questions

### Q1: What if the service does not start?

Check Docker logs:

```bash
docker logs meteo-data-download
```

Common causes include:

- Port 8000 is already in use; change the mapping to `-p 8001:8000`.
- The image does not exist; pull or build it first.
- Memory is insufficient; inspect system resources.

### Q2: What if the OpenAPI contract cannot be retrieved?

Check the service manually:

```bash
curl http://127.0.0.1:8000/openapi.json
```

If JSON is returned, the service is available; then inspect network or firewall settings. If the connection fails, the service is not running or the port is incorrect.

### Q3: What if AI-generated code does not run?

1. Confirm that `openapi.json` is current because the service may have changed.
2. Repeat Step 2 to retrieve the newest contract.
3. Confirm that the AI followed the actual contract rather than assuming endpoints.
4. Inspect the error and refine the prompt before generating again.

### Q4: How can data for multiple locations be downloaded?

Extend the generated code:

```python
locations = [
    {"name": "Beijing", "lat": 39.9042, "lon": 116.4074},
    {"name": "Shanghai", "lat": 31.2304, "lon": 121.4737},
    {"name": "Guangzhou", "lat": 23.1291, "lon": 113.2644},
]

for loc in locations:
    data = client.download_weather_data(
        latitude=loc["lat"],
        longitude=loc["lon"],
        start_date="2026-01-01",
        end_date="2026-01-31",
        variables=["temperature", "humidity"]
    )

    with open(f"data/{loc['name']}_weather.json", "w") as f:
        json.dump(data, f, indent=2)

    print(f"{loc['name']} downloaded")
```

## Advantages

| Traditional approach | Standard workflow |
| --- | --- |
| Manually read documentation and make mistakes | AI generates code from the OpenAPI contract |
| Rewrite code in every project | Reuse a standardized workflow |
| Update code manually after API changes | Retrieve `openapi.json` again |
| Memorize endpoint parameters | Follow the workflow instead |
| Long debugging cycles | AI generation plus structured error handling |

## Extensions

This workflow is not limited to meteorological data. It also applies to:

- Other local API services, including databases, file processing, and AI models
- Team standardization, where every member follows the same process
- CI/CD integration for automated data acquisition
- Research reproducibility through standardized data-download scripts

## Summary

Combining a local Docker service, an OpenAPI contract, and AI code generation creates a standardized meteorological-data workflow:

1. No need to memorize API details.
2. Quick reuse in every project.
3. More accurate and reliable code.
4. Easier maintenance and extension.

The central idea is to standardize repeated work, automate standardized work, let AI handle routine detail, and reserve human attention for higher-level decisions.

## References

- [OpenAPI Specification](https://swagger.io/specification/)
- [Docker Documentation](https://docs.docker.com/)
- [Requests Library](https://docs.python-requests.org/)
- [AI for Code Generation Best Practices](https://github.com/luongnv89/claude-howto)
