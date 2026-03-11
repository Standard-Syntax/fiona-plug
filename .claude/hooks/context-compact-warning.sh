#!/usr/bin/env bash
# context-compact-warning.sh
# UserPromptSubmit hook — injects a context advisory when Claude has written
# many thoughts/ files in this session (proxy for a long, heavy session).
# Outputs JSON additionalContext to stdout (Claude Code v2.1.9+ feature).

# Only warn based on thoughts/ activity since last session-summary.json write,
# not total commit count (which would always fire on established repos).

SUMMARY_FILE=".ai-artifacts/session-summary.json"
WARN=false

# Count thoughts/ files modified more recently than the last session summary.
# This approximates "files written this session" without tracking session state.
if [[ -f "$SUMMARY_FILE" && -d "thoughts/" ]]; then
  RECENT_THOUGHTS=$(find thoughts/ -name "*.md" -newer "$SUMMARY_FILE" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "${RECENT_THOUGHTS:-0}" -gt 8 ]]; then
    WARN=true
  fi
fi

if [[ "$WARN" == "true" ]]; then
  printf '{"additionalContext": "Context Advisory: This session has written many thoughts/ documents (%s files since last stop). If responses feel heavy or unfocused, consider running /context_compact to compress session state before continuing."}\n' "${RECENT_THOUGHTS:-?}"
fi

exit 0
