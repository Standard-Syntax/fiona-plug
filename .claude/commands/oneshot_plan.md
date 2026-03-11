---
description: Create an implementation plan and immediately set up implementation for a ticket. Invoke with: /oneshot_plan ENG-XXXX
model: opus
---

# Oneshot Plan + Impl

You are tasked with creating an implementation plan and then immediately setting up the implementation session for it.

## Step 1: Create the Implementation Plan

Follow the full `ralph_plan` process for the given ticket:

1. Use `linear` CLI to fetch the ticket: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
2. Read the ticket and all comments fully
3. Move the item to "plan in progress" using Linear MCP tools
4. Dispatch research agents in parallel (see `ralph_plan` for the full agent table)
5. Wait for all research agents to complete
6. Write the plan to `thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md`
7. Run `humanlayer thoughts sync`
8. Attach the plan to the ticket and move to "plan in review"

## Step 2: Set Up Implementation

Immediately after the plan is written, follow the `create_worktree` process:

1. Fetch the Linear branch name for `ENG-XXXX`
2. Create the worktree: `./hack/create_worktree.sh ENG-XXXX [BRANCH_NAME]`
3. Launch the implementation session:
   ```bash
   humanlayer launch \
     --model opus \
     --dangerously-skip-permissions \
     --dangerously-skip-permissions-timeout 15m \
     --title "implement ENG-XXXX" \
     -w ~/wt/humanlayer/ENG-XXXX \
     "/implement_plan at [RELATIVE_PLAN_PATH] and when you are done implementing and all tests pass, /commit_auto then /describe_pr_auto then add a comment to the Linear ticket ENG-XXXX with the PR link"
   ```

## Notes

- Replace `ENG-XXXX` with the actual ticket number throughout
- Use the relative plan path: `thoughts/shared/plans/[filename].md`
- This runs plan + impl launch back-to-back without human approval between them — only use when you're confident in the plan scope
