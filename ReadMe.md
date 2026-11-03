# pi in a Container, Set Up Like Claude Code

Run the [pi coding agent](https://pi.dev) inside a container so it only sees the project folder you choose, with extensions, subagents and skills that make it behave much like Claude Code. Tuned for local models (gpt-oss, Qwen) served by llama.cpp or LM Studio on a 128 GB Framework Desktop.

![Base image](https://img.shields.io/badge/base-node%3A24--trixie--slim-A81D33?logo=debian)
![Runtime](https://img.shields.io/badge/runtime-podman%20%7C%20docker-892CA0?logo=podman)
![Models](https://img.shields.io/badge/models-llama.cpp%20local-1f6feb)

---

## Table of contents

- [Why](#why)
- [What you get](#what-you-get)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [How the run command works](#how-the-run-command-works)
- [Everyday usage](#everyday-usage)
- [Choosing local models](#choosing-local-models)
- [Using LM Studio instead of llama.cpp](#using-lm-studio-instead-of-llamacpp)
- [Customising](#customising)
- [Updating pi](#updating-pi)
- [Using pi without the container](#using-pi-without-the-container)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Repository layout](#repository-layout)

---

## Why

pi is a small, extensible coding agent that works well with local models. Out of the box it is minimal: no subagents, no todo list, no plan mode, no permission prompts. This repository adds those, and runs everything in a container:

- **Isolation:** pi only sees the one project folder you mount at `/workspace`.
- **Persistence:** settings, sessions and git config live in a folder on the host.
- **Claude Code habits:** the same working style, safety prompts, subagents and review skills.
- **Local first:** defaults, presets and timeouts are chosen for llama.cpp on unified memory.

## What you get

| Claude Code | This repository (pi) | How to use it |
|-------------|----------------------|---------------|
| System prompt habits (read before edit, be concise, verify, report honestly) | `config/APPEND_SYSTEM.md` | Always on |
| Permission prompts for risky commands | `extensions/guard.ts` | Asks before `rm -r`, `sudo`, `git push`, `git reset --hard`, force operations, `curl \| sh` and similar; blocks edits to `.env`, `.git/`, `node_modules/` |
| `TodoWrite` | `extensions/todo.ts` | The model uses the `todo` tool; you see the list with `/todos` |
| `AskUserQuestion` | `extensions/questionnaire.ts` | The model uses the `questionnaire` tool |
| Plan mode | `extensions/plan-mode/` | `/plan` or `Ctrl+Alt+P` to toggle, `/plan-status` for progress |
| `Agent` tool with subagents | `extensions/subagent/` + `agents/` | The model uses the `subagent` tool (single, parallel or chain) |
| `Explore` agent | `agents/explore.md` | Read-only search, returns a summary |
| `Plan` agent | `agents/plan.md` | Read-only architect, returns a plan |
| `general-purpose` agent | `agents/general-purpose.md` | Full tools, isolated context |
| Code-review agent | `agents/code-reviewer.md` | Read-only review of a diff |
| `/init` | `skills/init` | `/skill:init` |
| `/code-review` | `skills/code-review` | `/skill:code-review` |
| `/security-review` | `skills/security-review` | `/skill:security-review` |
| `/simplify` | `skills/simplify` | `/skill:simplify` |
| Commit workflow | `skills/commit` | `/skill:commit` (only when you call it) |
| Multi-agent workflows | `prompts/` | `/implement <task>`, `/explore-and-plan <task>`, `/implement-and-review <task>` |

The model loads skills on its own when a task matches their description; `/skill:<name>` forces one. Subagents cannot start their own subagents, as in Claude Code: each agent file lists its tools, and `subagent` is not among them.

The four extensions in `extensions/` besides `guard.ts` are taken from the [pi-mono examples](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions) (MIT, see `extensions/LICENSE-pi-mono`). Changes are noted at the top of each file.

## Requirements

- [Podman](https://podman.io/) 4.x or newer (rootless works). Docker also works with small changes.
- A model server on the host: [llama.cpp](https://llama.app) built with GPU support (Vulkan or ROCm on the Framework Desktop), or [LM Studio](https://lmstudio.ai) with its `lms` command (see [Using LM Studio](#using-lm-studio-instead-of-llamacpp)).
- About 70 GB of free disk space for the default model set.

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/pi-work.git
cd pi-work
```

### 2. Start the model server on the host

```bash
llama serve --models-preset llama/models.ini --host 127.0.0.1 --port 8080
```

On the first start it downloads `gpt-oss-120b` (marked `load-on-startup`). The other presets download and load the first time you select them. Check it is up:

```bash
curl http://127.0.0.1:8080/models
```

### 3. Build the image

```bash
podman build -t pi-work .
```

### 4. Create the host folders

```bash
mkdir -p "$HOME/github/pi-work/projects"   # the code pi works on
mkdir -p "$HOME/.pi-container"             # settings, sessions and git config
```

### 5. Run it

```bash
podman run -it --rm \
  --name pi-work \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  --network=host \
  -e HOME=/tmp/pi-home \
  --mount type=bind,source="$HOME/github/pi-work/projects",target=/workspace,Z \
  --mount type=bind,source="$HOME/.pi-container",target=/tmp/pi-home,Z \
  -w /workspace \
  pi-work
```

On the first run the entrypoint creates `~/.pi-container/.pi/agent/` with the default `settings.json`, `models.json` (the LM Studio models), the system-prompt addition and the subagents. pi then starts with `gpt-oss-120b`. No login is needed for local models.

## How the run command works

| Option | What it does |
|--------|--------------|
| `-it` | Interactive terminal, needed for the pi interface |
| `--rm` | Deletes the container when you exit (your data is on the host) |
| `--name pi-work` | Fixed name, so you can find it with `podman ps` |
| `--userns=keep-id` | Rootless Podman: maps your host user ID into the container |
| `--user "$(id -u):$(id -g)"` | Runs as your user, so new files are owned by you on the host |
| `--network=host` | Lets pi reach the model server on the host (`127.0.0.1:8080` for llama.cpp, `127.0.0.1:1234` for LM Studio) |
| `-e HOME=/tmp/pi-home` | Points the home directory at the persistent mount |
| `--mount ...target=/workspace` | The project folder pi can see and edit |
| `--mount ...target=/tmp/pi-home` | Persistent folder for settings, sessions and git config |
| `-w /workspace` | Starts pi in the project folder |

The image sets `LLAMA_BASE_URL=http://127.0.0.1:8080`, which is all pi's built-in llama.cpp provider needs. To use another server, add `-e LLAMA_BASE_URL=http://host:port`.

> **Note:** the `Dockerfile` sets a default of `HOME=/workspace/.pi-home`. It is used only if you run the image without `-e HOME=...`. The configuration then ends up inside the project folder, which is why `.pi-home/` is in `.gitignore`.

## Everyday usage

### Shell alias

```bash
alias pi-box='podman run -it --rm \
  --userns=keep-id --user "$(id -u):$(id -g)" --network=host \
  -e HOME=/tmp/pi-home \
  --mount type=bind,source="$PWD",target=/workspace \
  --mount type=bind,source="$HOME/.pi-container",target=/tmp/pi-home \
  -w /workspace pi-work'
```

The alias mounts the **current directory**, so you can `cd` into any project and run `pi-box`.

### Passing arguments to pi

Anything after the image name is passed to `pi`:

```bash
pi-box --continue                       # resume the most recent session
pi-box -p "explain this repository"     # one-off prompt, non-interactive
pi-box --model qwen3-coder-30b          # start with another model
```

### Useful commands inside pi

| Command | What it does |
|---------|--------------|
| `/model` | Pick a model (`Ctrl+S` saves it as the default) |
| `/llama` | Load, unload or download models on the router |
| `/plan` | Toggle read-only plan mode |
| `/todos` | Show the model's todo list |
| `/skill:code-review` | Review the current changes |
| `/implement <task>` | Explore, plan and implement with subagents |
| `/compact` | Summarise the conversation to free context |
| `/reload` | Reload settings, skills, prompts and extensions |

### Opening a shell in the container

```bash
podman run -it --rm --entrypoint bash \
  --userns=keep-id --user "$(id -u):$(id -g)" \
  --mount type=bind,source="$PWD",target=/workspace \
  -w /workspace pi-work
```

## Choosing local models

`llama/models.ini` defines three presets. The section name is the model ID in pi.

| Preset | Size in memory | Use it for |
|--------|----------------|-----------|
| `gpt-oss-120b` | ~63 GB + context | Default. Best tool use and reasoning that fits the machine |
| `qwen3-coder-30b` | ~32 GB + context | Fast coding without a thinking phase |
| `gpt-oss-20b` | ~12 GB + context | Subagents and quick questions; fits next to `gpt-oss-120b` |

Things that matter with local models:

- **Context.** The presets use 128K tokens (64K for `gpt-oss-20b`, split over two slots). Pi compacts automatically when about 16K tokens are left. If prompt processing gets slow, lower `ctx-size`; pi reads the real value from the server.
- **Timeouts.** Long prompts can take minutes to process, so `settings.json` raises `httpIdleTimeoutMs` to 15 minutes.
- **Reasoning effort.** gpt-oss reads it from `chat-template-kwargs` in the preset (`low`, `medium`, `high`), not from pi's `/thinking` setting. Qwen thinking models do follow `/thinking`.
- **Subagents share the GPU.** At most two subagents run at once. They use the session's model unless the agent file says otherwise, see below.
- **Sampling.** The presets use each model's recommended values. Do not lower gpt-oss's temperature; it gets worse at tool calls.

### Faster subagents

To run read-only agents on the small model while you keep `gpt-oss-120b` in the main session, add a `model` line to the agent's front matter, for example in `~/.pi-container/.pi/agent/agents/explore.md` (replace the symlink with a copy first, see [Customising](#customising)):

```yaml
model: llama.cpp/gpt-oss-20b
```

### Framework Desktop notes

- Give the GPU as much memory as possible. If a large model fails to load, raise the GPU memory limit (the UMA setting in the BIOS, or the amdgpu/TTM memory limits on Linux) and restart the router.
- Vulkan builds of llama.cpp are the easiest to get running on the Ryzen AI Max+ 395; ROCm builds can be faster at prompt processing.
- Newer and better models appear often. To add one, copy a preset section, change the name and `hf-repo`, and restart the router.

## Using LM Studio instead of llama.cpp

`config/models.json` adds an `lmstudio` provider with the same three models, the same sampling values and the same context sizes. Pi talks to LM Studio's OpenAI-compatible server on `127.0.0.1:1234`.

| Model ID in pi | Context | Memory |
|----------------|---------|--------|
| `lmstudio/openai/gpt-oss-120b` | 128K | ~63 GB + context |
| `lmstudio/qwen/qwen3-coder-30b` | 128K | ~32 GB + context |
| `lmstudio/openai/gpt-oss-20b` | 64K | ~12 GB + context |

### 1. Load the models and start the server (on the host)

```bash
lmstudio/load-models.sh           # gpt-oss-120b
lmstudio/load-models.sh fast      # gpt-oss-120b + gpt-oss-20b for subagents
lmstudio/load-models.sh coder     # qwen3-coder-30b + gpt-oss-20b
```

The script downloads missing models with `lms get`, loads them with the context length pi expects, and starts the server. You can do the same in the LM Studio app: load each model with the **context length** from the table above, then start the server in the Developer tab. If you load a model with a smaller context, lower `contextWindow` in `models.json` to match, or pi compacts too late and the server rejects the request.

Unlike the llama.cpp router, LM Studio does not load models on demand for pi: a model must be loaded before you select it.

### 2. Make LM Studio the default

Edit `~/.pi-container/.pi/agent/settings.json`:

```json
"defaultProvider": "lmstudio",
"defaultModel": "openai/gpt-oss-120b",
```

Or pick it per session with `/model`, or per run with `pi-box --model lmstudio/openai/gpt-oss-120b`. For faster subagents, use `model: lmstudio/openai/gpt-oss-20b` in an agent file (see [Faster subagents](#faster-subagents)).

### Differences from llama.cpp

- **Reasoning effort** for gpt-oss follows pi's `/thinking` setting (`low`, `medium`, `high`); pi sends it as `reasoning_effort`.
- **Sampling** is sent by pi with every request (from `samplingParams` in `models.json`), so the values set in the LM Studio app are overridden.
- **Model names** are LM Studio catalog keys. If `lms ls` shows a different key for a model you downloaded yourself, change the `id` in `models.json` to match.

## Customising

All defaults live in `~/.pi-container/.pi/agent/` on the host:

| File | Created as | To customise |
|------|-----------|--------------|
| `settings.json` | Copy | Edit directly, or use `/settings` and `/model` in pi |
| `models.json` | Copy | Edit directly to add servers or models; `/model` reloads it |
| `APPEND_SYSTEM.md` | Symlink into the image | Replace the symlink with your own file |
| `agents/*.md` | Symlinks into the image | Replace a symlink with your own file, or add new `.md` files |

The entrypoint never overwrites existing files. Symlinks follow the image, so rebuilding updates them; files you replaced stay as they are.

The extensions, skills and prompts load from `/opt/pi-work` inside the image, through `"packages": ["/opt/pi-work"]` in `settings.json`. To add your own, put them in `~/.pi-container/.pi/agent/extensions/`, `skills/` or `prompts/`, or in a project's `.pi/` folder. Add project instructions to an `AGENTS.md` in the project root (`/skill:init` writes one).

## Updating pi

```bash
podman build --no-cache -t pi-work .
```

Pin a version with `--build-arg PI_VERSION=1.5.0`. Your settings and sessions in `~/.pi-container` are not affected.

## Using pi without the container

The repository is also a pi package. On a host with pi installed:

```bash
pi install /path/to/pi-work
mkdir -p ~/.pi/agent/agents
ln -s /path/to/pi-work/agents/*.md ~/.pi/agent/agents/
ln -s /path/to/pi-work/config/APPEND_SYSTEM.md ~/.pi/agent/APPEND_SYSTEM.md
```

Then copy the settings you want from `config/settings.json`, leaving out the `packages` line (`pi install` adds it).

## Troubleshooting

<details>
<summary><b>pi shows no models, or "connection refused"</b></summary>

Check that the server is running on the host and that the run command includes `--network=host`:

- llama.cpp: `curl http://127.0.0.1:8080/models`
- LM Studio: `curl http://127.0.0.1:1234/v1/models` (the model must also be loaded, `lms ps`)
</details>

<details>
<summary><b>The model calls tools with broken arguments or loops</b></summary>

Make sure the preset has `jinja = true`, use a recent llama.cpp build, and do not lower the temperature of gpt-oss. Smaller models are less reliable at tool use; switch to `gpt-oss-120b` for complex tasks.
</details>

<details>
<summary><b>Requests time out on long conversations</b></summary>

Prompt processing on long contexts is slow on local hardware. Run `/compact`, lower `ctx-size` in the preset, or raise `httpIdleTimeoutMs` in `settings.json`.
</details>

<details>
<summary><b>A subagent says a command was blocked</b></summary>

Subagents run without a UI, so the guard blocks risky commands instead of asking. Run the command yourself, or do that step in the main session.
</details>

<details>
<summary><b>"Permission denied" on mounted folders (Fedora / SELinux)</b></summary>

Add `relabel=private` to each mount, or use `,Z` as in the quick start. Only relabel folders that belong to you.
</details>

<details>
<summary><b>git asks "Please tell me who you are"</b></summary>

```bash
podman run -it --rm --entrypoint git \
  --userns=keep-id --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/pi-home \
  --mount type=bind,source="$HOME/.pi-container",target=/tmp/pi-home \
  pi-work config --global user.name "Your Name"
```

Repeat with `user.email`.
</details>

## Security notes

- The container limits which files pi can **see**. With `--network=host` it shares the host's network, including services that listen only on `127.0.0.1`.
- The guard extension is a safety net against mistakes, not a security boundary. Pattern matching can be bypassed; the container is the real boundary.
- pi asks before trusting a project's `.pi/` folder, which can contain extensions that run code. Review unfamiliar projects before trusting them. `AGENTS.md` files load without asking; treat them as untrusted text.
- SSH keys are not in the image. If you want to push from inside the container, mount only the key you need, read-only.

## Repository layout

```
.
├── Dockerfile           # Image: Node 24 + tools + pi + this repository
├── entrypoint.sh        # Seeds ~/.pi/agent on first start, then runs pi
├── package.json         # pi package manifest (extensions, skills, prompts)
├── config/
│   ├── settings.json    # Default settings (copied on first start)
│   ├── models.json      # LM Studio provider and models (copied on first start)
│   └── APPEND_SYSTEM.md # Claude Code-style working rules
├── agents/              # Subagents: explore, plan, general-purpose, code-reviewer
├── extensions/          # guard, todo, questionnaire, plan-mode, subagent
├── skills/              # init, code-review, security-review, simplify, commit
├── prompts/             # /implement, /explore-and-plan, /implement-and-review
├── llama/models.ini     # llama.cpp router presets for a 128 GB machine
├── lmstudio/load-models.sh # Loads the same models in LM Studio and starts its server
└── projects/            # Other git repositories (ignored by this repository)
```
