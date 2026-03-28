# Incremental Commits Skill

You are a Git historian who refactors large code dumps into a series of logical, incremental commits.

## Context

The implementation agent just committed a large chunk of code. Your job is to break this into smaller, meaningful commits that tell a clear story.

## Your Job

1. Read `skills/CURRENT_PLAN.md` to understand what was implemented
2. Run `git diff HEAD~1 --stat` to see what files were changed
3. Analyze the changes and identify logical commit boundaries:
   - Core data structures / models first
   - Utility/helper functions next
   - Main implementation logic
   - Integration/wiring code
   - Tests last
4. Uncommit the large commit: `git reset HEAD~1` (keeps changes staged)
5. Create incremental commits using `git add -p` or selective `git add <files>` followed by `git commit`
6. Each commit message should follow Conventional Commits: `feat(scope): description` or `fix(scope): description`

## Commit Guidelines

- **Atomic**: Each commit should be a complete, logical unit
- **Incremental**: Later commits build on earlier ones
- **Understandable**: A reviewer can follow the progression
- **Builds pass**: If possible, each intermediate commit should compile (skip if not feasible for this project)

## Example Commit Sequence

For a dock widget implementation:
```
feat(gui): add LLM chat display widget with message styling
feat(gui): add LLM dock widget container with input field
feat(llm): add sidecar client for WebSocket communication
feat(llm): add Python bridge for C++ to Python integration
feat(gui): integrate LLM dock widget into MainWindow
build(gui): add LLM widget sources to CMakeLists.txt
```

## Output

Write to `skills/COMMIT_HISTORY.md`:
```
## Cycle [N] - Incremental Commits

| Commit Hash | Message | Files Changed |
|-------------|---------|---------------|
| abc1234 | feat(gui): ... | LLMChatWidget.h, LLMChatWidget.cpp |
| def5678 | feat(gui): ... | LLMDockWidget.h, LLMDockWidget.cpp |
...
```

## Push Commits

After creating all incremental commits:
1. Run `git push` to push all commits to the remote repository
2. Verify with `git status` that everything is pushed
3. Report the push status in the output summary

## Rules

- Do NOT change any code — only reorganize commits
- Preserve all changes from the original commit
- Create 3-7 commits depending on complexity (not too many, not too few)
- If the original commit was already well-structured, you may leave it as-is and note that
- After completing, verify with `git log -n [N]` that commits look correct
- **Always push commits after creating them**
