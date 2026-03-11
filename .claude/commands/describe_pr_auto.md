---
description: Autonomously generate and apply PR descriptions without user approval. Use in automated/CI contexts. For interactive sessions where you want the user to review first, use /describe_pr instead.
---

# Generate PR Description (Autonomous)

You are tasked with generating a comprehensive pull request description and applying it directly. Do this autonomously — do NOT stop to ask for user feedback or approval.

## Steps to follow:

1. **Read the PR description template:**
   - First, check if `thoughts/shared/pr_description.md` exists
   - If it doesn't exist, use this fallback template:
     ```markdown
     ## What problem(s) was I solving?

     ## What user-facing changes did I ship?

     ## How I implemented it

     ## How to verify it

     ### Manual Testing

     ## Description for the changelog
     ```
   - Read the template carefully to understand all sections

2. **Identify the PR:**
   - Check current branch: `gh pr view --json url,number,title,state 2>/dev/null`
   - If no PR exists, list open PRs: `gh pr list --limit 10 --json number,title,headRefName,author`
   - Use the PR that matches the current branch or the most recently created one

3. **Check for existing description:**
   - Check if `thoughts/shared/prs/{number}_description.md` already exists
   - If it exists, read it — you'll be updating it

4. **Gather comprehensive PR information:**
   - Get the full PR diff: `gh pr diff {number}`
   - If error about no default remote, run `gh repo set-default` first
   - Get commit history: `gh pr view {number} --json commits`
   - Get PR metadata: `gh pr view {number} --json url,title,number,state,baseRefName`

5. **Analyze the changes thoroughly** (ultrathink about architectural implications and user impact):
   - Read through the entire diff carefully
   - Read any files referenced but not shown in the diff
   - Identify user-facing vs internal changes
   - Look for breaking changes or migration requirements

6. **Handle verification requirements:**
   - For each verification command in the template: run it
   - If it passes: mark `- [x]`
   - If it fails: keep `- [ ]` and note what failed
   - If it requires manual testing: keep `- [ ]` and note "requires manual testing"

7. **Generate and save the description:**
   - Fill out each section thoroughly based on your analysis
   - Write to `thoughts/shared/prs/{number}_description.md`
   - Run `humanlayer thoughts sync`

8. **Apply the description to the PR:**
   - `gh pr edit {number} --body-file thoughts/shared/prs/{number}_description.md`
   - Confirm the update was successful

## Important notes:
- This is autonomous — proceed without asking for confirmation
- Be thorough but concise — descriptions should be scannable
- Focus on the "why" as much as the "what"
- Include breaking changes or migration notes prominently
