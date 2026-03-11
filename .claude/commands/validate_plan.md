---
description: Validate implementation against plan, verify success criteria, identify issues
model: opus
---

# Validate Plan

You are tasked with validating that an implementation plan was correctly executed, verifying all success criteria and identifying any deviations or issues.

## Initial Setup

When invoked:
1. **Determine context** — Are you in an existing conversation or starting fresh?
   - If existing: Review what was implemented in this session
   - If fresh: Need to discover what was done through git and codebase analysis

2. **Locate the plan**:
   - If plan path provided, use it
   - Otherwise, search recent commits for plan references or ask user

3. **Read the plan completely yourself** (no limit/offset, no delegation):
   - Identify all phases
   - List success criteria per phase
   - Note all files that should have changed

4. **Gather implementation evidence**:
   ```bash
   git log --oneline -n 20
   git diff HEAD~N..HEAD  # Where N covers implementation commits
   ```

## Validation Process

### Step 1: Spawn Parallel Per-Phase Validators

Dispatch one `implementation-validator` agent per phase **simultaneously**:

```
Phase 1 validator prompt:
  Validate Phase 1 of [plan path].
  Plan path: [path]
  Phase number: 1
  Changed files since implementation: [list from git diff]
  Check all automated success criteria and file changes for this phase only.
  Return structured pass/fail report.

Phase 2 validator prompt:
  Validate Phase 2 of [plan path].
  [same structure...]

[Continue for all phases]
```

Also spawn one inline task:
```
Run `cd $(git rev-parse --show-toplevel) && make check test`
Return: exit code, any test failures, any lint errors
```

**Wait for ALL validators to complete before proceeding.**

### Step 2: Synthesize Results

Read all validator reports and compile:
- Overall pass/fail status per phase
- Specific deviations from plan
- Automated check results
- Items requiring manual testing

### Step 3: Generate Validation Report

```markdown
## Validation Report: [Plan Name]

### Overall Status: [PASS | FAIL | PARTIAL]

### Phase Summary
| Phase | Status | Issues |
|---|---|---|
| Phase 1: [Name] | ✓ PASS | — |
| Phase 2: [Name] | ⚠️ PARTIAL | See below |
| Phase 3: [Name] | ✗ FAIL | See below |

### Automated Verification
✓ Build passes: `make build`
✓ Tests pass: `make test`
✗ Linting issues: `make lint` (3 warnings — see details)

### Deviations from Plan
[Copy from validator reports, organized by phase]

### Manual Testing Required
1. [ ] [Manual step 1 from plan]
2. [ ] [Manual step 2 from plan]
3. [ ] [Additional manual verification]
```

### Step 4: On Failure — Resolution Path

If critical failures are found (automated checks failing, phases missing):

1. **Surface the issues clearly** — list each failure with file:line reference
2. **Categorize failures**:
   - 🔴 **Blocking** — must fix before merge (test failures, missing required changes)
   - 🟡 **Non-blocking** — should fix but not blocking (lint warnings, minor deviations)
   - 🟢 **Improvements** — implementation improved on the plan (document but don't block)

3. **Create follow-up ticket** for any blocking issues not fixed in this session:
   - Use Linear MCP tools to create a ticket in "Ready for Dev" status
   - Title: `[original ticket] validation failures — [brief description]`
   - Link to the original ticket
   - Include the validation report as the description

4. **Inform the user**:
   ```
   Validation found [N] blocking issues that must be addressed before merging.

   Blocking issues:
   - [Issue 1 with file:line]
   - [Issue 2 with file:line]

   I've created a follow-up ticket: [Linear link]

   Would you like me to fix the blocking issues now, or should we proceed with the PR and track fixes separately?
   ```

## Working with Existing Context

If you were part of the implementation:
- Review the conversation history
- Check your todo list for what was completed
- Focus validation on work done in this session
- Be honest about any shortcuts or incomplete items

## Orchestration Rules

- Read the plan YOURSELF before spawning validators — never delegate the initial plan read
- Spawn all phase validators SIMULTANEOUSLY — do not waterfall
- Each validator prompt must be SELF-CONTAINED with plan path and context
- After validators complete, synthesize all reports yourself

## Relationship to Other Commands

Recommended workflow:
1. `/implement_plan` — Execute the implementation
2. `/commit` — Create atomic commits for changes
3. `/validate_plan` — Verify implementation correctness
4. `/describe_pr` — Generate PR description

Validation works best after commits are made, as it can analyze the git history to understand what was implemented.
