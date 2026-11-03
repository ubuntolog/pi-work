---
description: Implement, review, then apply the review - one subagent per step
argument-hint: "<what to build>"
---
Use the subagent tool with the chain parameter to run this workflow:

1. The "general-purpose" agent implements: $@
2. The "code-reviewer" agent reviews the change from the previous step (use the {previous} placeholder).
3. The "general-purpose" agent fixes the Critical and Should-fix findings from the review (use the {previous} placeholder).

Run it as one chain. When it finishes, summarise what changed and which findings were fixed.
