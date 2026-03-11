---
description: Create worktree and launch implementation session for a plan. Invoke with: /create_worktree ENG-XXXX or /create_worktree ENG-XXXX thoughts/shared/plans/your-plan.md
---

# Create Worktree

You are tasked with setting up a worktree and launching an implementation session.

## Step 1: Parse Inputs

Extract from the invocation:
- **Issue number**: The `ENG-XXXX` ticket number (required)
- **Plan path**: Optional path to the plan file (e.g., `thoughts/shared/plans/2025-01-08-ENG-XXXX-description.md`)

If the issue number is missing, ask: "Please provide a ticket number (e.g., ENG-1234)."

## Step 2: Gather Required Data

If plan path was NOT provided:
- Look in `thoughts/shared/plans/` for a file matching `*ENG-XXXX*`
- If multiple match, list them and ask the user which to use
- If none found, ask the user for the plan path

Fetch the Linear branch name:
- Use Linear MCP tools to get the ticket's suggested branch name for `ENG-XXXX`
- If unavailable, derive it as: `eng-XXXX-[kebab-case-ticket-title]`

Verify the plan path exists and uses a relative path starting with `thoughts/shared/...`

## Step 3: Confirm with User

Present the plan before executing:

```
Based on the input, I plan to create a worktree with the following details:

Ticket:        ENG-XXXX
Worktree path: ~/wt/humanlayer/ENG-XXXX
Branch name:   [BRANCH_NAME from Linear]
Plan file:     [RELATIVE_PLAN_PATH]

Launch command:
  humanlayer launch \
    --model opus \
    --dangerously-skip-permissions \
    --dangerously-skip-permissions-timeout 15m \
    --title "implement ENG-XXXX" \
    -w ~/wt/humanlayer/ENG-XXXX \
    "/implement_plan at [RELATIVE_PLAN_PATH] and when you are done implementing and all tests pass, /commit_auto then /describe_pr_auto then add a comment to the Linear ticket ENG-XXXX with the PR link"

Shall I proceed?
```

Incorporate any user feedback, then proceed.

## Step 4: Create Worktree

```bash
./hack/create_worktree.sh ENG-XXXX [BRANCH_NAME]
```

## Step 5: Launch Implementation Session

```bash
humanlayer launch \
  --model opus \
  --dangerously-skip-permissions \
  --dangerously-skip-permissions-timeout 15m \
  --title "implement ENG-XXXX" \
  -w ~/wt/humanlayer/ENG-XXXX \
  "/implement_plan at [RELATIVE_PLAN_PATH] and when you are done implementing and all tests pass, /commit_auto then /describe_pr_auto then add a comment to the Linear ticket ENG-XXXX with the PR link"
```

## Important Notes

- **Path rule**: Always use ONLY the relative path starting with `thoughts/shared/...` — no absolute paths
- **Binary**: Use `humanlayer` — verify it's on PATH with `which humanlayer` if unsure
- **Thoughts sync**: The thoughts/ directory is synced between the main repo and worktrees — relative paths always work
