---
description: Pick the next open GitHub issue and run the full research pipeline on it.
  Optionally filter by label or provide an issue number directly. Invoke with:
  /next_github_issue or /next_github_issue bug or /next_github_issue 42
model: opus
---

# Next GitHub Issue → Research

You are tasked with selecting the next GitHub issue to research and running the full
research pipeline on it, producing a research document in `thoughts/shared/research/`.

This command mirrors `ralph_research` but sources the ticket from GitHub Issues instead
of Linear, and uses GitHub-native operations (labels, `gh issue comment`) instead of
Linear status transitions.

---

## PART I — ISSUE SELECTION

### Step 1: Parse Invocation

Extract from the invocation:
- **Issue number** (e.g., `42`): if provided, use it directly — skip selection logic
- **Label filter** (e.g., `bug`, `needs-research`): if provided, filter candidates by this label
- If neither is provided, select from all open unassigned issues

### Step 2: List Candidate Issues (if no issue number given)

Fetch open, unassigned issues sorted by creation date (oldest first):

```bash
gh issue list \
  --state open \
  --search "no:assignee" \
  --limit 20 \
  --json number,title,labels,milestone,createdAt,url \
  --jq 'sort_by(.createdAt)'
```

If a label filter was provided, add `--label "LABEL"` to the command.

If no issues are returned:
- Without a label filter: EXIT and inform the user there are no open unassigned issues.
- With a label filter: EXIT and inform the user no issues match that label, and suggest
  running without a filter.

### Step 3: Select the Issue

**If a specific issue number was provided in the invocation:**
- Use it directly — skip to Part II

**Otherwise**, from the candidate list:
- Prefer issues with priority labels (`P0`, `P1`, `priority`, `urgent`, `high-priority`)
  if any exist; otherwise take the lowest-numbered open unassigned issue

**Announce the selection before proceeding:**

```
Selected: #NUMBER — [title]
URL: [url]
Labels: [labels or "none"]
Created: [createdAt]

Proceeding with research. (Ctrl-C to cancel)
```

---

## PART II — SETUP

### Step 1: Save the Issue

Fetch and save the issue as readable markdown:

```bash
mkdir -p thoughts/shared/tickets
gh issue view NUMBER > thoughts/shared/tickets/GH-NUMBER.md
```

Read the saved file fully — including issue body and all comments — to understand what
research is needed and review any prior investigation or blocked attempts.

### Step 2: Check for Existing Research

```bash
ls thoughts/shared/research/*GH-NUMBER* 2>/dev/null
```

If a file exists, read it and inform the user before proceeding:
```
Research already exists at [path]. Re-running will create a new document.
Proceeding...
```

### Step 3: Assign and Signal Start

```bash
gh issue edit NUMBER --add-assignee "@me"
```

Post a start comment:
```bash
gh issue comment NUMBER --body "Starting research on this issue."
```

If either command fails (e.g., insufficient repo permissions), note it and continue —
do not abort research over a labeling or assignment failure.

### Step 4: Validate Scope

Read the issue body and all comments. If insufficient information exists to conduct
research (no repro steps for a bug, no description for a feature), post a clarifying
comment and exit:

```bash
cat > /tmp/gh-clarify-NUMBER.md << 'EOF'
Need more information before research can begin:

- [Specific question 1]
- [Specific question 2]
EOF
gh issue comment NUMBER --body-file /tmp/gh-clarify-NUMBER.md
```

Then EXIT and inform the user what clarification was requested.

---

## PART III — PARALLEL RESEARCH

Dispatch ALL of the following agents **simultaneously** based on what the issue needs:

| Agent | When to use | Prompt |
|---|---|---|
| `codebase-locator` | Always | Find all files related to: [issue feature area or bug area]. Return full paths grouped by purpose. |
| `codebase-analyzer` | Always | Analyze how [relevant component] currently works. mode: plan. Start at [entry point if known]. Return file:line references for all key logic. |
| `codebase-pattern-finder` | When similar issues/features exist | Find existing examples of [pattern] in the codebase relevant to [issue topic]. Return code snippets with file:line references. |
| `thoughts-locator` | Always | Find any research, plans, or decisions related to [issue topic] in thoughts/. |
| `thoughts-analyzer` | If thoughts-locator finds relevant docs | Analyze [doc path]. Extract key decisions, constraints, and still-relevant findings. |
| `web-search-researcher` | If issue references external libs, CVEs, or external behavior | Research: [specific external question from issue]. Return direct links with findings. |

**Wait for ALL agents to complete before proceeding.**

Think deeply about the findings before writing anything.

---

## PART IV — SYNTHESIZE AND DOCUMENT

Identify technical constraints and opportunities. Document how the system works today
without prescribing a specific fix or implementation approach.

Write findings to: `thoughts/shared/research/YYYY-MM-DD-GH-NUMBER-description.md`

Filename format: `2025-01-08-GH-42-webhook-retry-logic.md`

Use this structure:

```markdown
---
date: [ISO datetime with timezone]
researcher: [from: git config user.name]
git_commit: [from: git rev-parse --short HEAD]
branch: [from: git branch --show-current]
repository: [from: gh repo view --json name -q .name]
topic: "[issue title]"
tags: [research, relevant-component-names]
source: github-issue
issue_number: NUMBER
issue_url: [url]
status: complete
last_updated: [YYYY-MM-DD]
last_updated_by: [researcher]
---

# Research: [Issue Title]

## Research Question
[What the issue asks us to investigate or fix]

## Summary
[High-level findings — what exists, how it works, key constraints]

## Detailed Findings

### [Component/Area 1]
- Description with `file:line` references
- Data flow and integration points

### [Component/Area 2]
...

## Potential Implementation Approaches
[Brief, unbiased description of 2-3 possible approaches found during research.
Do NOT recommend — just document what's possible given the codebase.]

## Risks and Constraints
- [Technical constraint discovered]
- [Risk or edge case to consider]

## Historical Context (from thoughts/)
- `thoughts/shared/...` — [what this doc says]

## Open Questions
[Anything that needs human input before planning can begin]
```

Run `humanlayer thoughts sync` to save the research.

---

## PART V — UPDATE THE ISSUE

Post a research summary comment on the GitHub issue:

```bash
cat > /tmp/gh-research-NUMBER.md << 'EOF'
## Research Complete

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

Full research document: `thoughts/shared/research/YYYY-MM-DD-GH-NUMBER-description.md`
EOF
gh issue comment NUMBER --body-file /tmp/gh-research-NUMBER.md
```

Add a label to signal research is done (silently skip if the label doesn't exist):

```bash
gh issue edit NUMBER --add-label "research-complete" 2>/dev/null || true
```

---

## PART VI — COMPLETION MESSAGE

```
✅ Completed research for #NUMBER: [issue title]

Research topic: [research topic description]

The research has been:
- Created at thoughts/shared/research/YYYY-MM-DD-GH-NUMBER-description.md
- Synced to thoughts repository
- Commented on GitHub issue #NUMBER

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

View the issue: [url]
```

---

## Orchestration Rules

- Read all input files YOURSELF before spawning agents — never delegate initial reads
- Spawn all independent research agents SIMULTANEOUSLY — do not waterfall
- Each agent prompt must be SELF-CONTAINED — include all context the agent needs
- After all agents complete, read every file they reference before writing the research doc
- Never spawn an agent to do something you can do in one tool call yourself
- Work on ONE issue only
