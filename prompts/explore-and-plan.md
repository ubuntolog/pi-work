---
description: Explore the code and produce a plan, without changing anything
argument-hint: "<what to build>"
---
Use the subagent tool with the chain parameter to run this workflow:

1. The "explore" agent finds all code relevant to: $@
2. The "plan" agent writes an implementation plan for "$@" from the previous step's findings (use the {previous} placeholder).

Run it as one chain and show me the plan. Do NOT implement anything.
