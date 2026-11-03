/**
 * Guard Extension - Claude Code-style safety checks
 *
 * - Asks before running destructive or outward-facing bash commands
 *   (rm -r, sudo, git push, git reset --hard, ...). "Always" remembers the
 *   exact command for the rest of the session.
 * - Blocks write/edit on secrets and version-control internals
 *   (.env files, .git/, node_modules/).
 *
 * Without a UI (pi -p, subagents) risky commands are blocked, not asked.
 */

import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const RISKY_COMMANDS: { pattern: RegExp; reason: string }[] = [
	{ pattern: /\brm\s+(-[a-zA-Z]*[rRf]|--recursive|--force)/, reason: "recursive or forced delete" },
	{ pattern: /\bsudo\b|\bsu\s+-/, reason: "privilege escalation" },
	{ pattern: /\bgit\s+push\b/, reason: "publishes commits to a remote" },
	{ pattern: /\bgit\s+reset\s+--hard\b/, reason: "discards uncommitted work" },
	{ pattern: /\bgit\s+clean\s+-[a-zA-Z]*f/, reason: "deletes untracked files" },
	{ pattern: /\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, reason: "discards uncommitted work" },
	{ pattern: /\bgit\s+branch\s+-D\b/, reason: "deletes a branch" },
	{ pattern: /\bgit\s+(rebase|filter-branch)\b/, reason: "rewrites history" },
	{ pattern: /--force\b|--force-with-lease\b/, reason: "forced operation" },
	{ pattern: /\b(chmod|chown)\s+(-R\s+)?[0-7]*777\b/, reason: "world-writable permissions" },
	{ pattern: /\b(mkfs|dd\s+if=|shred)\b/, reason: "can destroy disk data" },
	{ pattern: /\b(curl|wget)\b[^|]*\|\s*(ba|z)?sh\b/, reason: "pipes a download into a shell" },
	{ pattern: /\b(npm|pnpm|yarn)\s+publish\b/, reason: "publishes a package" },
	{ pattern: /\bdocker\s+(system\s+prune|rm|rmi)\b|\bpodman\s+(system\s+prune|rm|rmi)\b/, reason: "removes containers or images" },
];

const PROTECTED_PATHS: { test: (p: string) => boolean; reason: string }[] = [
	{ test: (p) => /^\.env(\..+)?$/.test(path.basename(p)) && !p.endsWith(".example"), reason: "environment secrets" },
	{ test: (p) => p.split(/[\\/]/).includes(".git"), reason: "git internals" },
	{ test: (p) => p.split(/[\\/]/).includes("node_modules"), reason: "installed dependencies" },
];

export default function (pi: ExtensionAPI) {
	const allowedThisSession = new Set<string>();

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName === "write" || event.toolName === "edit") {
			const filePath = String(event.input.path ?? "");
			const hit = PROTECTED_PATHS.find((p) => p.test(filePath));
			if (!hit) return undefined;
			if (ctx.hasUI) ctx.ui.notify(`Blocked ${event.toolName} to ${filePath} (${hit.reason})`, "warning");
			return {
				block: true,
				reason: `"${filePath}" is protected (${hit.reason}). Ask the user to change it themselves if it really needs changing.`,
			};
		}

		if (event.toolName !== "bash") return undefined;

		const command = String(event.input.command ?? "");
		const hit = RISKY_COMMANDS.find((r) => r.pattern.test(command));
		if (!hit || allowedThisSession.has(command)) return undefined;

		if (!ctx.hasUI) {
			return { block: true, reason: `Blocked without a UI to confirm: ${hit.reason}. Ask the user to run it.` };
		}

		const choice = await ctx.ui.select(`Allow this command? (${hit.reason})\n\n  ${command}\n`, [
			"Yes",
			"Yes, and don't ask again for this exact command this session",
			"No",
		]);

		if (choice === "Yes") return undefined;
		if (choice?.startsWith("Yes, and")) {
			allowedThisSession.add(command);
			return undefined;
		}
		return {
			block: true,
			reason: "The user declined this command. Do not retry it; ask what they want instead.",
		};
	});
}
