---
description: Implement highest priority small Linear ticket with worktree setup
model: opus
---

## PART I — TICKET SELECTION

**If a ticket is mentioned:**
- Use `linear` CLI to fetch the item: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
- Read the ticket and all comments to understand the implementation plan and any concerns

**If no ticket is mentioned:**
- Use Linear MCP tools to fetch the top 10 priority items in status "ready for dev"
- Note all items in the `links` section
- Select the highest priority SMALL or XS issue (if none exist, EXIT IMMEDIATELY and inform the user)
- Use `linear` CLI to fetch the selected item: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
- Read the ticket and all comments fully

---

## PART II — SETUP

Think deeply about the ticket.

1. Move the item to "in dev" using the Linear MCP tools
2. Check the `links` section — identify the linked implementation plan document
3. If no plan exists, move the ticket back to "ready for spec" and EXIT with an explanation
4. Read the plan document completely

Create a TodoWrite task list to track your implementation.

---

## PART III — WORKTREE AND LAUNCH

1. Read `hack/create_worktree.sh` to understand the script
2. Create a new worktree with the Linear branch name:
   ```
   ./hack/create_worktree.sh ENG-XXXX BRANCH_NAME
   ```
   (Get BRANCH_NAME from the Linear ticket's suggested branch field)

3. Launch the implementation session:
   ```
   humanlayer launch \
     --model opus \
     --dangerously-skip-permissions \
     --dangerously-skip-permissions-timeout 15m \
     --title "implement ENG-XXXX" \
     -w ~/wt/humanlayer/ENG-XXXX \
     "/implement_plan at thoughts/shared/plans/[PLAN_FILENAME] and when you are done implementing and all tests pass, /commit_auto then /describe_pr then add a comment to the Linear ticket ENG-XXXX with the PR link"
   ```

---

## Orchestration Rules

- Work on ONE ticket only — the highest priority SMALL or XS issue
- Use `humanlayer launch` (not `humanlayer-nightly`) — verify which binary is on PATH if unsure
- Always use the relative plan path starting with `thoughts/shared/plans/...`
- The thoughts/ directory is synced between main repo and worktrees — use relative paths only
