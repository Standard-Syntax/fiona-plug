---
description: Autonomously create git commits without user approval. Use in automated/CI contexts where no human is present to confirm. For interactive sessions where you want to show the user the plan first, use /commit instead.
---

# Commit Changes (Autonomous)

You are tasked with creating git commits for the changes made during this session. Do this autonomously — do NOT stop to ask for user feedback or approval.

## Process:

1. **Think about what changed:**
   - Review the conversation history and understand what was accomplished
   - Run `git status` to see current changes
   - Run `git diff` to understand the modifications
   - Consider whether changes should be one commit or multiple logical commits

2. **Plan your commit(s):**
   - Identify which files belong together
   - Draft clear, descriptive commit messages
   - Use imperative mood in commit messages
   - Focus on why the changes were made, not just what

3. **Execute immediately — no user confirmation needed:**
   - Use `git add` with specific files (never use `-A` or `.`)
   - Never commit the `thoughts/` directory or anything inside it
   - Never commit dummy files, test scripts, or other files not directly part of the implementation
   - Create commits with your planned messages: `git commit -m "..."`
   - Show the result with `git log --oneline -n [number]`

## Remember:
- You have the full context of what was done in this session
- Group related changes together
- Keep commits focused and atomic when possible
- **IMPORTANT**: Never stop and ask for feedback from the user — this is an autonomous command
- **NEVER add co-author information or Claude attribution**
- Write commit messages as if the user wrote them
