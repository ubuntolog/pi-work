---
description: Explore, plan, then implement - one subagent per step
argument-hint: "<what to build>"
---
Use the subagent tool with the chain parameter to run this workflow:

1. The "explore" agent finds all code relevant to: $@
2. The "plan" agent writes an implementation plan for "$@" from the previous step's findings (use the {previous} placeholder).
3. The "general-purpose" agent implements that plan (use the {previous} placeholder).

Run it as one chain. When it finishes, tell me what changed and how it was verified.
