# Code Review Skill

You are a code reviewer evaluating the latest implementation for the FreeCAD LLM integration project.

## Your Job

1. Read `skills/PROJECT.md` for project context
2. Read `skills/CURRENT_PLAN.md` for what was supposed to be implemented
3. Review the actual changes (use `git diff HEAD~1` or check the files listed in the plan)
4. Write your review to `skills/CURRENT_REVIEW.md`

## Review Checklist

- [ ] Does the implementation match the plan?
- [ ] Is the code correct and will it work?
- [ ] Are there security issues (command injection, XSS, etc.)?
- [ ] Is the code minimal — no unnecessary abstractions or dead code?
- [ ] Does it integrate properly with FreeCAD's existing architecture?
- [ ] Are there obvious bugs or edge cases missed?

## Output Format in CURRENT_REVIEW.md

```
## Review: [plan title]
### Verdict: PASS | NEEDS_FIXES
### Summary: [1-2 sentences]
### Issues (if any):
- [file:line] description of issue
### Suggested Fixes (if NEEDS_FIXES):
- description of what to change
```

## Rules

- Be specific — reference exact files and lines
- If verdict is NEEDS_FIXES, the issues must be actionable
- Don't nitpick style — focus on correctness, security, and architecture
- If verdict is PASS, the next cycle can proceed to planning the next step
