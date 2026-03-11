---
description: Create detailed implementation plans through interactive research and iteration
model: opus
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or ticket reference was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task/ticket description (or reference to a ticket file)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this command with a ticket file directly: `/create_plan thoughts/allison/tickets/eng_1234.md`
For deeper analysis, try: `/create_plan think deeply about thoughts/allison/tickets/eng_1234.md`
```

Then wait for the user's input.

## Orchestration Rules

- Read all input files YOURSELF before spawning agents — never delegate initial reads
- Spawn all independent agents SIMULTANEOUSLY — do not waterfall unless there's a true dependency
- Each agent prompt must be SELF-CONTAINED — include all context the agent needs; agents cannot see your conversation history
- After all agents complete, READ every file they reference before synthesizing
- Never spawn an agent to do something you can do in one tool call yourself

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Read all mentioned files immediately and FULLY**:
   - Ticket files, research documents, related plans, any JSON/data files mentioned
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context

2. **Spawn initial research agents simultaneously**:

   Dispatch ALL of the following at once before asking the user any questions:

   | Agent | Prompt |
   |---|---|
   | `codebase-locator` | Find all files related to: [ticket/task feature area]. Return full paths grouped by purpose. |
   | `codebase-analyzer` | Analyze how [relevant component] currently works. **mode: plan**. Start at [entry point if known]. Return file:line references and flag any issues the planner needs to know about. |
   | `codebase-pattern-finder` | Find existing examples of [pattern] in the codebase that could serve as templates for [feature]. Return code snippets with file:line. |
   | `thoughts-locator` | Find any research, plans, or decisions related to [ticket topic] in thoughts/. |
   | `thoughts-analyzer` | [Only if thoughts-locator finds relevant docs] Analyze [doc path]. Extract key decisions, constraints, and still-relevant findings. |

   **Wait for ALL agents to complete before proceeding.**

3. **Read all files identified by research agents**:
   - After agents complete, read ALL files they identified as relevant
   - Read them FULLY into the main context

4. **Analyze and verify understanding**:
   - Cross-reference the ticket requirements with actual code
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality

5. **Present informed understanding and focused questions**:
   ```
   Based on the ticket and my research of the codebase, I understand we need to [accurate summary].

   I've found that:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions you genuinely cannot answer through code investigation.

### Step 2: Research & Discovery

After getting initial clarifications:

1. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research agents to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

2. **Create a research todo list** using TodoWrite

3. **If multiple implementation approaches exist, analyze them in parallel**:

   Dispatch approach-analysis agents simultaneously:

   ```
   codebase-analyzer — Approach A impact:
     mode: plan
     Analyze what would need to change to implement [Approach A description].
     Focus on: [relevant files from Step 1 research].
     Return: affected files, risk level, estimated scope, any blockers.

   codebase-analyzer — Approach B impact:
     mode: plan
     Analyze what would need to change to implement [Approach B description].
     Focus on: [relevant files from Step 1 research].
     Return: affected files, risk level, estimated scope, any blockers.
   ```

   Wait for both to complete, then present a comparison to the user.

4. **Present findings and design options**:
   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] - [pros/cons, scope estimate]
   2. [Option B] - [pros/cons, scope estimate]

   **Open Questions:**
   - [Technical uncertainty]
   - [Design decision needed]

   Which approach aligns best with your vision?
   ```

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Create initial plan outline**:
   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]

   Does this phasing make sense? Should I adjust the order or granularity?
   ```

2. **Get feedback on structure** before writing details

### Step 4: Detailed Plan Writing

After structure approval:

1. **Write the plan** to `thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md`
   - With ticket: `2025-01-08-ENG-1478-parent-child-tracking.md`
   - Without ticket: `2025-01-08-improve-error-handling.md`

2. **Use this template structure**:

````markdown
# [Feature/Task Name] Implementation Plan

## Overview
[Brief description of what we're implementing and why]

## Current State Analysis
[What exists now, what's missing, key constraints discovered — with file:line refs]

## Desired End State
[Specification of the desired end state and how to verify it]

## What We're NOT Doing
[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach
[High-level strategy and reasoning. Reference rejected approaches briefly.]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```language
// Specific code to add/modify
```

### Success Criteria

#### Automated Verification:
- [ ] Migration applies cleanly: `make migrate`
- [ ] Unit tests pass: `make test`
- [ ] Type checking passes: `make typecheck`
- [ ] Linting passes: `make lint`

#### Manual Verification:
- [ ] Feature works as expected when tested via UI
- [ ] Edge case handling verified manually
- [ ] No regressions in related features

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human before proceeding to Phase 2.

---

## Phase 2: [Descriptive Name]
[Same structure...]

---

## Testing Strategy
[Unit, integration, and manual testing approach]

## References
- Original ticket: `thoughts/allison/tickets/eng_XXXX.md`
- Research document: `thoughts/shared/research/[relevant].md`
- Similar implementation: `[file:line]`
````

### Step 5: Sync and Review

1. **Sync the thoughts directory**:
   - Run `humanlayer thoughts sync`

2. **Present the draft plan location**:
   ```
   I've created the initial implementation plan at:
   `thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md`

   Please review it and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?
   ```

3. **Iterate based on feedback** — be ready to adjust phases, technical approach, success criteria, or scope. Run `humanlayer thoughts sync` after each round of changes.

## Important Guidelines

1. **Be Skeptical**: Question vague requirements, identify potential issues early, don't assume — verify with code

2. **Be Interactive**: Don't write the full plan in one shot. Get buy-in at each major step.

3. **Be Thorough**: Read all context files COMPLETELY before planning. Use `mode: plan` on codebase-analyzer so issues surface during planning, not during implementation.

4. **Be Practical**: Focus on incremental, testable changes. Consider migration and rollback. Include "what we're NOT doing."

5. **No Open Questions in Final Plan**: If you encounter open questions during planning, STOP and resolve them before writing. Every decision must be made before finalizing.

## Success Criteria Guidelines

Always separate into two categories:

**Automated Verification** (can be run by execution agents):
- Commands: `make test`, `make lint`, etc.
- Prefer `make` commands over raw tool invocations: `make -C humanlayer-wui check` instead of `cd humanlayer-wui && bun run fmt`

**Manual Verification** (requires human testing):
- UI/UX functionality
- Performance under real conditions
- Edge cases that are hard to automate

## Sub-task Spawning Best Practices

1. **Spawn multiple tasks in parallel** for efficiency
2. **Each task should be focused** on a specific area
3. **Be EXTREMELY specific about directories** in prompts — never say "UI" when you mean `humanlayer-wui/`
4. **Request specific file:line references** in responses
5. **Wait for all tasks to complete** before synthesizing
6. **Verify sub-task results** — if results seem off, spawn follow-up tasks to cross-check
