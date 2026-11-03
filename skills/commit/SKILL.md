---
name: commit
description: Create a git commit for the current changes with a well-written message. Use only when the user explicitly asks to commit.
disable-model-invocation: true
---

# Commit

Only commit because the user asked. Never push unless they also asked for that.

## Steps

1. Run `git status`, `git diff HEAD` and `git log --oneline -10` to see the change and the repository's message style.
2. If you are on `main` or `master` and the user did not say to commit there, ask whether to create a branch first.
3. Stage only files that belong to this change, by name. Do not use `git add -A` or `git add .`. Never stage secrets such as `.env` files or credentials; warn the user if they are in the diff.
4. Write the message in the repository's style. If there is none: a summary line under 72 characters in the imperative mood ("Add", "Fix"), a blank line, then why the change was made, wrapped at 72 characters.
5. Commit with a heredoc so the formatting survives:
   ```bash
   git commit -F - <<'MSG'
   Summary line

   Why the change was made.
   MSG
   ```
6. Run `git status` to confirm. If a pre-commit hook fails, fix the problem and make a NEW commit. Do not use `--amend` or `--no-verify`.
