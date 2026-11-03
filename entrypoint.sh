#!/bin/bash
# Seed the persistent pi config on first start, then launch pi.
# Existing files are never overwritten, so your own edits survive rebuilds.
set -euo pipefail

BUNDLE=/opt/pi-work
AGENT_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"

mkdir -p "$AGENT_DIR/agents"

# settings.json and models.json are copied (pi writes to settings.json from /settings
# and /model; models.json is yours to edit for other servers or models).
for f in settings.json models.json; do
  [ -e "$AGENT_DIR/$f" ] || cp "$BUNDLE/config/$f" "$AGENT_DIR/$f"
done

# The system prompt addition and subagents are symlinked, so a rebuild updates them.
# Replace a symlink with a real file to customise it.
[ -e "$AGENT_DIR/APPEND_SYSTEM.md" ] || ln -s "$BUNDLE/config/APPEND_SYSTEM.md" "$AGENT_DIR/APPEND_SYSTEM.md"
for agent in "$BUNDLE"/agents/*.md; do
  target="$AGENT_DIR/agents/$(basename "$agent")"
  [ -e "$target" ] || [ -L "$target" ] || ln -s "$agent" "$target"
done

exec pi "$@"
