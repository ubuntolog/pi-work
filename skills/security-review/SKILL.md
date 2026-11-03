---
name: security-review
description: Security review of pending changes or a given area of code - injection, auth, secrets, unsafe deserialization, path traversal and similar. Use when the user asks for a security review or audit.
---

# Security review

Find the change the same way as a code review: named target first, else `git diff HEAD`, else `git diff main...HEAD`, else `git show HEAD`.

## Check for

- **Injection** - SQL, shell commands, template rendering, LDAP, XPath built from user input.
- **Path traversal** - user input reaching file paths without normalisation and a root check.
- **AuthN / AuthZ** - missing permission checks, trusting client-supplied IDs or roles, insecure session or token handling.
- **Secrets** - keys, passwords or tokens in code, logs, error messages or test fixtures.
- **Unsafe parsing** - `pickle`, `yaml.load`, `eval`, unsafe XML parsers, deserialising untrusted data.
- **Crypto** - homemade crypto, weak hashes for passwords, non-random tokens, disabled TLS verification.
- **Web** - XSS, CSRF, open redirects, SSRF, permissive CORS.
- **Dependencies** - newly added packages: are they well known, pinned, and actually needed?

## Rules

- Trace each candidate from the untrusted source to the dangerous sink. If you cannot show the path, drop it.
- Rate each finding High, Medium or Low, and include `file:line`, the attack scenario, and a fix.
- Do not report theoretical issues with no reachable input, or style.
- Do not modify files unless asked.

End with a one-line summary. "No security issues found in this change" is a valid result.
