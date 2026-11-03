---
name: simplify
description: Simplify recently changed code without changing its behaviour - remove duplication, dead code and needless abstraction, reuse existing helpers. Use when the user asks to simplify, clean up or tidy changes.
---

# Simplify

Scope: the files the user named, else the uncommitted diff (`git diff HEAD`), else the last commit. Do not touch code outside that scope.

## Look for

1. Code that duplicates a helper that already exists in the project. Search with grep before writing anything new.
2. Dead code: unused variables, imports, parameters, branches that cannot run.
3. Abstractions with one caller that add no clarity: inline them.
4. Deep nesting that early returns would flatten.
5. Repeated expensive work, such as the same file read or query inside a loop.
6. Comments that only repeat the code.

## Rules

- Behaviour must not change. No new features, no renamed public APIs, no reformatting of untouched lines.
- Make one kind of change at a time, with small edits.
- After editing, run the project's tests or build. If they fail, fix or revert your change.
- Finish with a short list: `file:line` - what you simplified. If nothing was worth changing, say so.
