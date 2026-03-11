#!/usr/bin/env bash
# auto-lint.sh
# PostToolUse hook — runs a fast, file-scoped linter/formatter after every Write or Edit.
# Supports: Go, TypeScript/JavaScript, Python.
# Non-blocking: exit 1 sends feedback to Claude but does not halt execution.

INPUT=$(cat)

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only act on writes with a known file path
if [[ -z "$FILE" ]]; then
  exit 0
fi

# Skip if file doesn't exist (e.g. was deleted)
if [[ ! -f "$FILE" ]]; then
  exit 0
fi

# Skip thoughts/ and .ai-artifacts/ — not source code
if [[ "$FILE" =~ ^thoughts/ || "$FILE" =~ ^\.ai-artifacts/ ]]; then
  exit 0
fi

FEEDBACK=""

case "$FILE" in
  *.go)
    if command -v gofmt &>/dev/null; then
      if [[ -n "$(gofmt -l "$FILE" 2>&1)" ]]; then
        gofmt -w "$FILE" 2>/dev/null
        FEEDBACK="gofmt: reformatted $FILE"
      fi
    fi
    if command -v golangci-lint &>/dev/null; then
      LINT=$(golangci-lint run --fast "$FILE" 2>&1 | head -20)
      if [[ -n "$LINT" ]]; then
        FEEDBACK="${FEEDBACK:+$FEEDBACK$'\n'}golangci-lint:\n$LINT"
      fi
    fi
    ;;

  *.ts|*.tsx)
    if [[ -f "node_modules/.bin/prettier" ]]; then
      node_modules/.bin/prettier --write "$FILE" 2>/dev/null
    fi
    if [[ -f "node_modules/.bin/eslint" ]]; then
      LINT=$(node_modules/.bin/eslint --max-warnings=0 "$FILE" 2>&1 | head -20)
      if [[ -n "$LINT" ]]; then
        FEEDBACK="eslint:\n$LINT"
      fi
    fi
    ;;

  *.js|*.jsx|*.mjs)
    if [[ -f "node_modules/.bin/prettier" ]]; then
      node_modules/.bin/prettier --write "$FILE" 2>/dev/null
    fi
    ;;

  *.py)
    if command -v ruff &>/dev/null; then
      LINT=$(ruff check --fix "$FILE" 2>&1 | head -20)
      if echo "$LINT" | grep -qi "error\|E[0-9]\{3\}"; then
        FEEDBACK="ruff:\n$LINT"
      fi
    elif command -v black &>/dev/null; then
      black "$FILE" 2>/dev/null
    fi
    ;;
esac

if [[ -n "$FEEDBACK" ]]; then
  printf "Lint/format feedback for %s:\n%b\n" "$FILE" "$FEEDBACK" >&2
  exit 1
fi

exit 0
