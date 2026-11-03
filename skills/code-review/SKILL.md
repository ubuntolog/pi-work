---
name: code-review
description: Review code changes for bugs, security problems and needless complexity. Use when the user asks for a review of the current diff, a branch, a commit, or specific files.
---

# Code review

## 1. Find the change

- If the user named files, a commit or a branch, review that.
- Otherwise review uncommitted work: `git diff HEAD`. If empty, `git diff main...HEAD` (try `master` if `main` does not exist). If still empty, `git show HEAD`.

## 2. Review

For a diff over about 300 lines, delegate to the `code-reviewer` subagent, one call per group of related files, and merge the results. Otherwise review it yourself:

1. Read each changed hunk and enough surrounding code to understand it.
2. Check: wrong logic, off-by-one, null or empty input, error paths, resource leaks, concurrency, broken callers of changed functions, missing tests for new behaviour, injection and secrets.
3. For every finding, confirm it by reading the code again. Drop anything you cannot tie to a concrete input or state.

## 3. Report

Ranked, most severe first:

- **`file:line`** - the problem, the input that triggers it, and the fix.

Then a one-line verdict. If you found nothing real, say "No issues found". Do not pad the list.

Do not change any files unless the user asked you to fix the findings.
