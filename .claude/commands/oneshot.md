---
description: Research a ticket and immediately launch a planning session. Invoke with: /oneshot ENG-XXXX
model: opus
---

# Oneshot Research + Plan Launch

You are tasked with researching a ticket and then immediately launching a full planning session for it.

## Step 1: Research the Ticket

Follow the full `ralph_research` process for the given ticket:

1. Use `linear` CLI to fetch the ticket: `linear fetch ENG-XXXX > thoughts/shared/tickets/ENG-XXXX.md`
2. Read the ticket and all comments fully
3. Move the item to "research in progress" using Linear MCP tools
4. Dispatch research agents in parallel (codebase-locator, codebase-analyzer, thoughts-locator, web-search-researcher if needed)
5. Wait for all research agents to complete
6. Write the research document to `thoughts/shared/research/YYYY-MM-DD-ENG-XXXX-description.md`
7. Run `humanlayer thoughts sync`
8. Attach the research to the ticket and move to "research in review"

## Step 2: Launch Planning Session

Immediately after research is complete, launch a planning session:

```bash
humanlayer launch \
  --model opus \
  --dangerously-skip-permissions \
  --dangerously-skip-permissions-timeout 14m \
  --title "plan ENG-XXXX" \
  "/oneshot_plan ENG-XXXX"
```

## Notes

- Replace `ENG-XXXX` with the actual ticket number throughout
- This chains research → plan → impl-launch in a fully automated pipeline
- The planning session will use the research document you just created
