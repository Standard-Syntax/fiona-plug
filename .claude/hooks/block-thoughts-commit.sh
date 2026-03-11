#!/usr/bin/env bash
# block-thoughts-commit.sh
# PreToolUse hook — blocks git commands that would stage or commit thoughts/ files.
# Claude Code passes event JSON on stdin; we parse with jq.
# Exit code 2 = blocking deny with feedback to Claude via stderr.

INPUT=$(cat)

# Only care about Bash tool calls
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
if [[ "$TOOL" != "Bash" ]]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Block: git add with thoughts/ as an explicit target
if echo "$COMMAND" | grep -qE 'git add.*thoughts/'; then
  echo "BLOCKED: Never stage the thoughts/ directory directly. Use specific file paths that exclude thoughts/." >&2
  exit 2
fi

# Block: git add -A or git add . (stages everything, would include thoughts/)
if echo "$COMMAND" | grep -qE 'git add\s+(-A|\.)(\s|$)'; then
  echo "BLOCKED: Do not use 'git add -A' or 'git add .' — these stage thoughts/ files. Stage specific paths explicitly, e.g. 'git add src/ cmd/'." >&2
  exit 2
fi

# Block: git commit -a (stages all tracked files, would include tracked thoughts/ files)
if echo "$COMMAND" | grep -qE 'git commit\s+-[a-zA-Z]*a'; then
  echo "BLOCKED: Do not use 'git commit -a' — it stages all tracked files including thoughts/. Use explicit git add then git commit." >&2
  exit 2
fi

exit 0
