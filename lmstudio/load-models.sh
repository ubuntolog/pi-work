#!/bin/bash
# Download (first run only) and load the LM Studio models that config/models.json expects,
# then start the server on 127.0.0.1:1234. Run this on the host, not in the container.
# Context lengths must match "contextWindow" in config/models.json.
#
#   lmstudio/load-models.sh           # gpt-oss-120b                   (~63 GB + context)
#   lmstudio/load-models.sh fast      # gpt-oss-120b + gpt-oss-20b     (~75 GB + context)
#   lmstudio/load-models.sh coder     # qwen3-coder-30b + gpt-oss-20b  (~44 GB + context)
set -euo pipefail

load() {
  local model=$1 ctx=$2
  lms ls | grep -q "$model" || lms get "$model"
  lms load "$model" --context-length "$ctx" --gpu max
}

case "${1:-default}" in
  default) load openai/gpt-oss-120b 131072 ;;
  fast)    load openai/gpt-oss-120b 131072; load openai/gpt-oss-20b 65536 ;;
  coder)   load qwen/qwen3-coder-30b 131072; load openai/gpt-oss-20b 65536 ;;
  *) echo "usage: $0 [default|fast|coder]" >&2; exit 1 ;;
esac

lms server start --port 1234
lms ps
