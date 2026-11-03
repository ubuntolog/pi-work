---
name: init
description: Create or update AGENTS.md, the project instructions file pi loads at startup. Use when the user asks to initialise a project, document the codebase for the agent, or update AGENTS.md.
---

# Create AGENTS.md

Write a short `AGENTS.md` in the project root that helps a future agent work in this repository. If it already exists, improve it instead of replacing it. If a `CLAUDE.md` exists, read it and keep what is still true.

## Steps

1. Look at the project: `ls`, the README, the build and package files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, CI configs), and `git log --oneline -15`.
2. Find the real commands for building, testing (including one single test), linting and running.
3. Read two or three central source files to learn the architecture and conventions.
4. Write `AGENTS.md` with only these sections, skipping any that would be empty:
   - **Commands** - build, test, single test, lint, run. Exact commands only.
   - **Architecture** - the big picture that needs several files to understand. Not a file listing.
   - **Conventions** - rules that are not obvious from the code (naming, error handling, where tests go).
   - **Gotchas** - things that break easily or surprised you.

## Rules

- Keep it under 80 lines. Every line must save a future agent time.
- Do not list every file, repeat the README, or add generic advice such as "write clean code".
- Do not invent commands. If you could not verify one, leave it out.
