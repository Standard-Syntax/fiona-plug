#!/usr/bin/env bash
# auto-sync-thoughts.sh
# PostToolUse hook — runs `humanlayer thoughts sync` whenever Claude writes a file
# under the thoughts/ directory. Eliminates the need for every command to manually
# include a sync step.

INPUT=$(cat)

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only act on writes to thoughts/
if [[ -z "$FILE" ]]; then
  exit 0
fi

if [[ ! "$FILE" =~ ^thoughts/ ]]; then
  exit 0
fi

# Only sync markdown, text, and json files
if [[ ! "$FILE" =~ \.(md|txt|json)$ ]]; then
  exit 0
fi

# Run sync — quiet so it doesn't spam output; failures are non-fatal
if command -v humanlayer &>/dev/null; then
  humanlayer thoughts sync --quiet 2>/dev/null || true
fi

exit 0
