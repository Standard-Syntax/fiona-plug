---
description: Research highest priority Linear ticket needing investigation
model: opus
---

## PART I — TICKET SELECTION

**If a Linear ticket is mentioned:**
- Use `linear` CLI to fetch the item: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
- Read the ticket and all comments to understand what research is needed and any previous attempts

**If no ticket is mentioned:**
- Use Linear MCP tools to fetch the top 10 priority items in status "research needed"
- Note all items in the `links` section
- Select the highest priority issue (if none exist, EXIT IMMEDIATELY and inform the user)
- Use `linear` CLI to fetch the selected item: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
- Read the ticket and all comments fully

---

## PART II — SETUP

Think deeply about what research is needed.

1. Move the item to "research in progress" using the Linear MCP tools
2. Read any linked documents in the `links` section to understand context
3. If insufficient information to conduct research, add a comment asking for clarification and move back to "research needed" — then EXIT

Create a TodoWrite task list to track your research.

---

## PART III — PARALLEL RESEARCH

Dispatch ALL of the following agents **simultaneously** based on what the ticket needs:

| Agent | When to use | Prompt |
|---|---|---|
| `codebase-locator` | Always | Find all files related to: [ticket feature area]. Return full paths grouped by purpose. |
| `codebase-analyzer` | Always | Analyze how [relevant component] currently works. mode: plan. Start at [entry point if known]. Return file:line references for all key logic. |
| `codebase-pattern-finder` | When similar features exist | Find existing examples of [pattern] in the codebase that could serve as a template. Return code snippets with file:line references. |
| `thoughts-locator` | Always | Find any research, plans, or decisions related to [ticket topic] in thoughts/. |
| `thoughts-analyzer` | If thoughts-locator finds relevant docs | Analyze [doc path]. Extract key decisions, constraints, and still-relevant findings. |
| `web-search-researcher` | Only if Linear comments indicate external research needed | Research: [specific external question]. Return direct links with findings. |

**Wait for ALL agents to complete before proceeding.**

Think deeply about the findings before writing anything.

---

## PART IV — SYNTHESIZE AND DOCUMENT

Identify technical constraints and opportunities. Be unbiased — document how systems work today without prescribing an implementation approach.

Write findings to: `thoughts/shared/research/YYYY-MM-DD-ENG-XXXX-description.md`

Filename format:
- With ticket: `2025-01-08-ENG-1478-parent-child-tracking.md`
- Without ticket: `2025-01-08-error-handling-patterns.md`

Use this structure:

```markdown
---
date: [ISO datetime with timezone]
researcher: [from thoughts status or git config]
git_commit: [current commit hash]
branch: [current branch]
repository: [repo name]
topic: "[ticket title or research topic]"
tags: [research, relevant-component-names]
status: complete
last_updated: [YYYY-MM-DD]
last_updated_by: [researcher]
---

# Research: [Ticket Title]

## Research Question
[What the ticket asks us to investigate]

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

## PART V — UPDATE THE TICKET

1. Attach the research document to the ticket using Linear MCP tools with proper link formatting
2. Add a comment summarizing key findings (3-5 bullets)
3. Move the item to "research in review" using the Linear MCP tools

---

## PART VI — COMPLETION MESSAGE

Print this message (replace placeholders with actual values):

```
✅ Completed research for ENG-XXXX: [ticket title]

Research topic: [research topic description]

The research has been:
- Created at thoughts/shared/research/YYYY-MM-DD-ENG-XXXX-description.md
- Synced to thoughts repository
- Attached to the Linear ticket
- Ticket moved to "research in review" status

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

View the ticket: https://linear.app/humanlayer/issue/ENG-XXXX/[ticket-slug]
```

---

## Orchestration Rules

- Read all input files YOURSELF before spawning agents — never delegate initial reads
- Spawn all independent research agents SIMULTANEOUSLY — do not waterfall
- Each agent prompt must be SELF-CONTAINED — include all context the agent needs
- After all agents complete, read every file they reference before writing the research doc
- Never spawn an agent to do something you can do in one tool call yourself
- Work on ONE ticket only — the highest priority issue
