---
description: Create implementation plan for highest priority Linear ticket ready for spec
model: opus
---

## PART I — TICKET SELECTION

**If a ticket is mentioned:**
- Use `linear` CLI to fetch the item: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
- Read the ticket and all comments to learn about past implementations, research, and any questions or concerns

**If no ticket is mentioned:**
- Use Linear MCP tools to fetch the top 10 priority items in status "ready for spec"
- Note all items in the `links` section
- Select the highest priority SMALL or XS issue (if none exist, EXIT IMMEDIATELY and inform the user)
- Use `linear` CLI to fetch the selected item: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
- Read the ticket and all comments fully

---

## PART II — SETUP

Think deeply about the ticket.

1. Move the item to "plan in progress" using the Linear MCP tools
2. Check the `links` section — if a plan document already exists, you're done. Respond with a link to the ticket.
3. Create a TodoWrite task list to track your planning work.

---

## PART III — PARALLEL RESEARCH

Before writing any plan, dispatch ALL of the following agents **simultaneously**:

| Agent | Prompt |
|---|---|
| `codebase-locator` | Find all files related to: [ticket feature area]. Return full paths grouped by purpose. |
| `codebase-analyzer` | Analyze how [relevant component] currently works. mode: plan. Return file:line references and flag any issues the planner needs to know about. |
| `codebase-pattern-finder` | Find existing examples of [pattern] in the codebase that could serve as a template for [ticket feature]. Return code snippets with file:line references. |
| `thoughts-locator` | Find any research, plans, or decisions related to [ticket topic] in thoughts/. |
| `thoughts-analyzer` | [Only if thoughts-locator finds relevant docs] Analyze [doc path]. Extract key decisions, constraints, and still-relevant findings. |

**Wait for ALL agents to complete before proceeding.**

Read every file the agents identified as relevant. Think deeply about how the pieces fit together.

---

## PART IV — PARALLEL APPROACH ANALYSIS

If there are 2+ plausible implementation approaches, dispatch approach-analysis agents **simultaneously**:

```
codebase-analyzer — Approach A impact:
  mode: plan
  Analyze what would need to change to implement [Approach A description].
  Focus on: [relevant files from previous research].
  Return: affected files, risk level, estimated scope, any blockers.

codebase-analyzer — Approach B impact:
  mode: plan
  Analyze what would need to change to implement [Approach B description].
  Focus on: [relevant files from previous research].
  Return: affected files, risk level, estimated scope, any blockers.
```

Wait for both to complete, then select and justify the recommended approach.

---

## PART V — WRITE THE PLAN

Write the plan to: `thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md`

Filename format:
- With ticket: `2025-01-08-ENG-1478-parent-child-tracking.md`
- Without ticket: `2025-01-08-improve-error-handling.md`

Use this structure:

````markdown
# [Feature/Task Name] Implementation Plan

## Overview
[Brief description of what we're implementing and why]

## Current State Analysis
[What exists now, what's missing, key constraints discovered — with file:line refs]

## Desired End State
[Specification of what should exist after this plan, and how to verify it]

## What We're NOT Doing
[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach
[Selected approach and reasoning. Reference rejected approaches briefly.]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required

#### 1. [File or Component]
**File**: `path/to/file.ext`
**Changes**: [Summary]

```language
// Specific code to add/modify
```

### Success Criteria

#### Automated Verification:
- [ ] Tests pass: `make test`
- [ ] Linting passes: `make lint`
- [ ] [Other automated check]: `[command]`

#### Manual Verification:
- [ ] [Specific manual step]
- [ ] [Another manual step]

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation from the human before proceeding to Phase 2.

---

## Phase 2: [Descriptive Name]
[Same structure...]

---

## Testing Strategy
[Unit, integration, and manual testing approach]

## References
- Original ticket: `thoughts/shared/tickets/ENG-XXXX.md`
- Research document: `thoughts/shared/research/[relevant].md`
- Similar implementation: `[file:line]`
````

---

## PART VI — SYNC AND ATTACH

1. Run `humanlayer thoughts sync` to sync the plan
2. Attach the plan document to the ticket using Linear MCP tools with proper link formatting
3. Add a terse comment with a link to the plan
4. Move the item to "plan in review" using the Linear MCP tools

---

## PART VII — COMPLETION MESSAGE

Print this message (replace placeholders with actual values):

```
✅ Completed implementation plan for ENG-XXXX: [ticket title]

Approach: [selected approach description]

The plan has been:
- Created at thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md
- Synced to thoughts repository
- Attached to the Linear ticket
- Ticket moved to "plan in review" status

Implementation phases:
- Phase 1: [phase 1 description]
- Phase 2: [phase 2 description]
- Phase 3: [phase 3 description if applicable]

View the ticket: https://linear.app/humanlayer/issue/ENG-XXXX/[ticket-slug]
```

---

## Orchestration Rules

- Read all input files YOURSELF before spawning agents — never delegate initial reads
- Spawn all independent research agents SIMULTANEOUSLY — do not waterfall
- Each agent prompt must be SELF-CONTAINED — include all context the agent needs
- After all agents complete, read every file they reference before writing the plan
- Never spawn an agent to do something you can do in one tool call yourself
- Work on ONE ticket only — the highest priority SMALL or XS issue
