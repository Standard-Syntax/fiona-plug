#!/usr/bin/env bash
# statusline.sh
# Claude Code statusline — context window monitor.
#
# Output: ▓▓▓░░░░░░░ 26% 52k/200k · $0.23 · +312/-47 · Opus · main
# Colors: green <40%, yellow <70%, orange <85%, red >=85%
#
# Install: add to .claude/settings.json (project-level) or ~/.claude/settings.json (user-level):
#   "statusLine": { "type": "command", "command": "bash .claude/hooks/statusline.sh" }
#
# Requires: jq (already required by all hooks in this config)

INPUT=$(cat)

# ── Parse stdin JSON ──────────────────────────────────────────────────────────

CTX_PCT=$(echo    "$INPUT" | jq -r '.context_window.used_percentage     // 0')
CTX_SIZE=$(echo   "$INPUT" | jq -r '.context_window.context_window_size // 200000')
CTX_TOKENS=$(echo "$INPUT" | jq -r '
  .context_window.current_usage |
  if . == null then 0
  else (.input_tokens // 0)
     + (.cache_creation_input_tokens // 0)
     + (.cache_read_input_tokens // 0)
  end')

COST=$(echo       "$INPUT" | jq -r '.cost.total_cost_usd      // 0')
LINES_ADD=$(echo  "$INPUT" | jq -r '.cost.total_lines_added   // 0')
LINES_DEL=$(echo  "$INPUT" | jq -r '.cost.total_lines_removed // 0')
MODEL=$(echo      "$INPUT" | jq -r '.model.display_name       // "?"')
CWD=$(echo        "$INPUT" | jq -r '.cwd                      // ""')

# ── Git branch ────────────────────────────────────────────────────────────────

BRANCH=""
if git -C "${CWD:-.}" rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  BRANCH=$(git -C "${CWD:-.}" branch --show-current 2>/dev/null)
fi

# ── ANSI colors (Catppuccin Mocha palette, 256-color) ────────────────────────

RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"

GREEN="\033[38;5;114m"    # context: safe
YELLOW="\033[38;5;221m"   # context: watch
ORANGE="\033[38;5;208m"   # context: getting heavy
RED="\033[38;5;203m"      # context: danger / deletion indicator
TEAL="\033[38;5;116m"     # cost
LAVENDER="\033[38;5;147m" # model
MAUVE="\033[38;5;183m"    # branch
SURFACE="\033[38;5;241m"  # separators / dim elements

# ── Context bar ───────────────────────────────────────────────────────────────
# 10 blocks, each represents 10%. Filled = ▓, empty = ░

BAR_WIDTH=10
FILLED=$(( CTX_PCT * BAR_WIDTH / 100 ))
[[ $FILLED -gt $BAR_WIDTH ]] && FILLED=$BAR_WIDTH
EMPTY=$(( BAR_WIDTH - FILLED ))

if   [[ $CTX_PCT -lt 40 ]]; then BAR_COLOR="$GREEN"
elif [[ $CTX_PCT -lt 70 ]]; then BAR_COLOR="$YELLOW"
elif [[ $CTX_PCT -lt 85 ]]; then BAR_COLOR="$ORANGE"
else                              BAR_COLOR="$RED"
fi

BAR=""
for (( i=0; i<FILLED; i++ )); do BAR+="▓"; done
for (( i=0; i<EMPTY;  i++ )); do BAR+="░"; done

# ── Token count: human-readable (awk — no external deps beyond awk) ──────────

TOKEN_DISPLAY=$(awk -v n="$CTX_TOKENS" 'BEGIN {
  if      (n >= 1000000) printf "%.1fM", n/1000000
  else if (n >= 1000)    printf "%.0fk", n/1000
  else                   printf "%d",    n
}')

CTX_MAX_DISPLAY=$(awk -v n="$CTX_SIZE" 'BEGIN {
  if      (n >= 1000000) printf "%.0fM", n/1000000
  else if (n >= 1000)    printf "%.0fk", n/1000
  else                   printf "%d",    n
}')

# ── Cost ──────────────────────────────────────────────────────────────────────

COST_STR=$(awk -v c="$COST" 'BEGIN {
  if (c == 0) printf "$0"
  else        printf "$%.2f", c
}')

# ── Compose sections ─────────────────────────────────────────────────────────

SEP="${SURFACE} · ${RESET}"

# Context: bar + percent + token count
CTX_SECTION="${BAR_COLOR}${BAR}${RESET} ${BOLD}${BAR_COLOR}${CTX_PCT}%${RESET} ${DIM}${TOKEN_DISPLAY}/${CTX_MAX_DISPLAY}${RESET}"

# Cost
COST_SECTION="${TEAL}${COST_STR}${RESET}"

# Lines added / removed
if [[ "$LINES_ADD" -gt 0 || "$LINES_DEL" -gt 0 ]]; then
  DIFF_SECTION="${GREEN}+${LINES_ADD}${RESET}${SURFACE}/${RESET}${RED}-${LINES_DEL}${RESET}"
else
  DIFF_SECTION="${SURFACE}±0${RESET}"
fi

# Model (strip "claude-" prefix if present for brevity)
MODEL_SHORT=$(echo "$MODEL" | sed 's/[Cc]laude[- ]//')
MODEL_SECTION="${LAVENDER}${MODEL_SHORT}${RESET}"

# Git branch
BRANCH_SECTION="${MAUVE}${BRANCH}${RESET}"

# ── Output ────────────────────────────────────────────────────────────────────
# Use printf "%b" to correctly interpret \033 escape sequences in variables.

if [[ -n "$BRANCH" ]]; then
  LINE="${CTX_SECTION}${SEP}${COST_SECTION}${SEP}${DIFF_SECTION}${SEP}${MODEL_SECTION}${SEP}${BRANCH_SECTION}"
else
  LINE="${CTX_SECTION}${SEP}${COST_SECTION}${SEP}${DIFF_SECTION}${SEP}${MODEL_SECTION}"
fi

printf "%b\n" "$LINE"
