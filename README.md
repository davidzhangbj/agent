<div align="center">
  <img src="brand-kit/banner/obAgent.png" alt="oceanbase agent logo" />
</div>

<p align="center">
  <a href="https://github.com/xataio/agent/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-green" alt="License - Apache 2.0"></a>&nbsp;
  <a href="https://github.com/xataio/agent/actions?query=branch%3Amain"><img src="https://github.com/xataio/agent/actions/workflows/ci.yml/badge.svg" alt="CI Build"></a> &nbsp;
  <a href="https://xata.io/discord"><img src="https://img.shields.io/discord/996791218879086662?label=Discord" alt="Discord"></a> &nbsp;
  <a href="https://twitter.com/xata"><img src="https://img.shields.io/twitter/follow/xata?style=flat" alt="X Follow" /> </a>
</p>

# Introduce

This project was modified from the [xata agent project](https://github.com/xataio/agent).

## Installation / self-hosted

We provide docker images for the agent itself.

Start a local instance via docker command:

```bash
docker run -d \
  --name ob-agent \
  --env CUSTOM_BASE_URL='https://dashscope.aliyuncs.com/compatible-mode/v1' \
  --env CUSTOM_API_KEY='sk-xxx' \
  --env CUSTOM_CHAT_MODEL_NAME='qwen-max-latest' \
  -p 8000:8000 \
  davidzhangbj/oceanbaseagent:latest
```

Replace CUSTOM_BASE_URL, CUSTOM_API_KEY, and CUSTOM_CHAT_MODEL_NAME with the relevant information you are using.<br>
Open the app at `http://localhost:8000`

## Development

Go to the `apps/dbagent` directory and follow the instructions in the [README](./apps/dbagent/README.md).

## Extensibility

The agent can be extended via the following mechanisms:

- **Tools**: These are functions that the agent can call to get information about the database. They are written in TypeScript.
- **Agents**: These are sequences of steps that the agent can follow to troubleshoot an issue. They are simply written in english.
