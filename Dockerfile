FROM node:24-trixie-slim

# Tools pi and its agents like to have around. pi uses rg for grep and fd (fdfind) for find.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep fd-find jq less procps bash openssh-client \
 && rm -rf /var/lib/apt/lists/*

# Install pi. Pin a version with: --build-arg PI_VERSION=1.5.0
ARG PI_VERSION=latest
RUN npm install -g --ignore-scripts "@earendil-works/pi-coding-agent@${PI_VERSION}" \
 && npm cache clean --force

# This repository: extensions, skills, prompts, subagents and default config.
COPY . /opt/pi-work
RUN chmod -R a+rX /opt/pi-work && chmod 755 /opt/pi-work/entrypoint.sh

# HOME lives in the mounted folder, so settings, sessions, credentials and git
# config persist on the host between runs. The run command overrides it.
# LLAMA_BASE_URL points pi's built-in llama.cpp provider at the host router
# (reachable as 127.0.0.1 with --network=host).
ENV HOME=/workspace/.pi-home \
    LLAMA_BASE_URL=http://127.0.0.1:8080 \
    PI_SKIP_VERSION_CHECK=1 \
    PI_TELEMETRY=0

WORKDIR /workspace

# Any extra args after the image name are passed through to `pi`.
ENTRYPOINT ["/opt/pi-work/entrypoint.sh"]
