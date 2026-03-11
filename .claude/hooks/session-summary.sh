#!/usr/bin/env bash
# session-summary.sh
# Stop hook — writes a machine-readable session summary to
# .ai-artifacts/session-summary.json when Claude finishes responding.
# Used by resume_handoff and create_handoff for context bootstrapping.

# Ensure output directory exists
mkdir -p .ai-artifacts

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
COMMIT=$(git log --oneline -1 2>/dev/null || echo "no commits")
TIMESTAMP=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
CHANGED_FILES=$(git status --short 2>/dev/null | head -20 || true)
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || true)

# Build JSON safely using jq to handle special characters in commit messages
if command -v jq &>/dev/null; then
  RECENT_ARRAY=$(echo "$RECENT_COMMITS" | jq -R -s 'split("\n") | map(select(length > 0))')
  CHANGED_ARRAY=$(echo "$CHANGED_FILES" | jq -R -s 'split("\n") | map(select(length > 0))')
  jq -n \
    --arg ts "$TIMESTAMP" \
    --arg branch "$BRANCH" \
    --arg commit "$COMMIT" \
    --argjson recent "$RECENT_ARRAY" \
    --argjson changed "$CHANGED_ARRAY" \
    '{timestamp: $ts, branch: $branch, last_commit: $commit, recent_commits: $recent, uncommitted_changes: $changed}' \
    > .ai-artifacts/session-summary.json
else
  # Fallback: write minimal JSON without jq (values may be unescaped if they contain quotes)
  cat > .ai-artifacts/session-summary.json << EOF
{
  "timestamp": "$TIMESTAMP",
  "branch": "$BRANCH",
  "note": "jq not available — install jq for full session summary"
}
EOF
fi

exit 0
