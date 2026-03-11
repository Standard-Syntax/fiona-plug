---
description: Implement technical plans from thoughts/shared/plans with verification
model: opus
---

# Implement Plan

You are tasked with implementing an approved technical plan from `thoughts/shared/plans/`. These plans contain phases with specific changes and success criteria.

## Getting Started

When given a plan path:
- Read the plan completely and check for any existing checkmarks (- [x])
- Read the original ticket and all files mentioned in the plan
- **Read files fully** — never use limit/offset parameters, you need complete context
- Create a todo list using TodoWrite to track your progress

**Before writing any code**, run the staleness check and ticket summary in parallel:

| Agent | Prompt |
|---|---|
| `plan-staleness-checker` | Check plan at [plan path] for drift. Return full staleness report. |
| `linear-comment-summarizer` | Summarize comments from [ticket path if known]. Return high-signal decisions and open questions only. |

**Wait for both to complete.**

If `plan-staleness-checker` returns **SIGNIFICANT DRIFT** — STOP. Inform the user and ask whether to update the plan or proceed cautiously. Do not implement against a stale plan without acknowledgment.

If no plan path provided, ask for one.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

If you encounter a mismatch:
- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Per-Phase Process

**At the start of each phase**, dispatch:

| Agent | Prompt |
|---|---|
| `dependency-impact-analyzer` | Analyze blast radius for these files/functions: [list from plan "Changes Required" for this phase]. Return callers, test coverage, and risk assessment. |

Wait for the result, then read the files the plan expects to modify.

**Implement** the phase changes.

**After implementing each phase**, dispatch in parallel:

| Agent | Prompt |
|---|---|
| `regression-detector` | Run targeted tests for these changed files: [list files modified this phase]. Return pass/fail verdict and any failures. |
| `implementation-validator` | Validate Phase [N] of [plan path]. Check automated success criteria and file changes. Return structured pass/fail report. |

**Wait for ALL validators to complete before proceeding.**

If any validation fails:
- Fix the issue before marking the phase complete
- Re-run the failing check after fixing
- Do NOT proceed to the next phase with a failing phase

After all automated validation passes, pause for human verification:
```
Phase [N] Complete — Ready for Manual Verification

Automated verification passed:
- [List automated checks that passed]
- Regression detector: [N tests run, all passing / N failures found]

Please perform the manual verification steps listed in the plan:
- [List manual verification items from the plan]

Let me know when manual testing is complete so I can proceed to Phase [N+1].
```

If instructed to execute multiple phases consecutively, skip the human pause between phases but still run automated validation and regression detection between each. Always pause after the last phase.

Do not check off items in the manual testing steps until confirmed by the user.

## Orchestration Rules

- Read all input files YOURSELF before spawning any agents — never delegate initial reads
- Spawn all independent agents SIMULTANEOUSLY — do not waterfall
- Each agent prompt must be SELF-CONTAINED — include all context the agent needs
- After agents complete, read every file they reference before synthesizing
- Never spawn an agent to do something you can do in one tool call yourself

## If You Get Stuck

When something isn't working as expected:
- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written (re-run `plan-staleness-checker` if needed)
- Present the mismatch clearly and ask for guidance
- Spawn `codebase-analyzer` with `mode: plan` to investigate unfamiliar territory

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Re-run `plan-staleness-checker` to verify the current state before continuing

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.
