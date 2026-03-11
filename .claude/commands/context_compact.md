---
description: Compact current session context to reclaim context window space without ending
  the session. Summarizes completed work, current state, and next steps into a condensed
  block. Run when responses feel slow or context feels heavy. Lighter than a full
  create_handoff + new session cycle.
---

# Context Compact

You are tasked with compressing the current session's context into a compact, high-density summary that preserves all critical state while discarding conversational overhead.

## When to Use This

Run `/context_compact` when:
- Responses are getting slower or less focused
- You've completed 2+ phases of a plan and have more to go
- The conversation has accumulated a lot of back-and-forth
- You're about to start a new major phase and want a clean state

## Process

### Step 1: Capture Current State

Before compacting, gather hard facts:

```bash
git branch --show-current
git log --oneline -5
git status --short
```

Also note:
- Which plan file you're working from (if any)
- Which phase you just completed
- Which phase is next
- Any in-progress work (files modified but not committed)

### Step 2: Write the Compact Summary

Write a dense summary to `.ai-artifacts/compact-context.md`:

```markdown
# Compact Context — [timestamp]

## Session State
- **Branch**: [branch name]
- **Plan**: [path to plan file, or "no plan"]
- **Last commit**: [hash and message]
- **Uncommitted changes**: [list or "none"]

## Completed This Session
[Bullet list of what was implemented/decided — one line each, with file:line refs]
- Implemented X in `path/to/file.go:45-89`
- Fixed Y by changing `config/settings.go:12`
- Decided to use approach Z because [one sentence reason]

## Current Phase
**Phase [N]: [Name]** — [COMPLETE | IN PROGRESS | NOT STARTED]
- [x] Step 1 done
- [x] Step 2 done
- [ ] Step 3 pending

## Next Actions (in order)
1. [Immediate next step]
2. [Step after that]
3. [Then...]

## Critical Learnings (don't forget these)
- [Pattern discovered that affects remaining work]
- [Gotcha or edge case found]
- [Constraint that must be respected]

## Files Modified This Session
[List with brief description of what changed]

## Open Questions
[Anything unresolved that needs human input]
```

### Step 3: Announce the Compact

After writing the file:

```
Context compacted. Summary written to .ai-artifacts/compact-context.md

Resuming from:
- Phase [N]: [name] — [status]
- Next action: [first next step]

Ready to continue.
```

### Step 4: Continue

Pick up immediately with the next action from the summary. Don't re-read files you've already read this session unless the compact summary indicates a specific file needs re-checking.

## Notes

- This is NOT a handoff — you stay in the same session
- If you need to hand off to a NEW session, use `/create_handoff` instead
- The compact file is useful as a handoff seed if the session does end unexpectedly
