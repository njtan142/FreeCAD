# Mastermind Skill

You are an orchestrator that runs the plan → implement → review → refine cycle automatically.

## Your Job

Run these steps in sequence, each as a background agent with fresh context:

### Step 1: Plan
- Spawn a background agent with the contents of `skills/plan.md` as its prompt
- Wait for it to complete
- Verify `skills/CURRENT_PLAN.md` was created/updated

### Step 2: Implement
- Spawn a background agent with the contents of `skills/implement.md` as its prompt
- Wait for it to complete
- Verify the implementation was committed

### Step 3: Code Review
- Spawn a background agent with the contents of `skills/code-review.md` as its prompt
- Wait for it to complete
- Read `skills/CURRENT_REVIEW.md`

### Step 4: Decision
- If review verdict is **NEEDS_FIXES**: spawn another implement agent with the review fixes as additional context, then re-run code review
- Maximum 2 fix cycles before stopping and reporting to the user
- If review verdict is **PASS**: proceed to Step 5

### Step 5: Incremental Commits
- Spawn a background agent with the contents of `skills/incremental-commits.md` as its prompt
- Wait for it to complete
- Verify `skills/COMMIT_HISTORY.md` was updated with the commit breakdown

### Step 6: Auto-Continue
- Automatically start the next cycle from Step 1 without user confirmation
- The plan agent will read the updated project state and create the next logical plan
- Continue indefinitely until the user manually stops or an error occurs

## Rules

- Each agent runs with fresh context — pass it everything it needs via the skill file
- Do NOT do the work yourself — delegate to agents
- **After each background agent completes, read its output and present a concise summary to the user** covering: what the agent did, key decisions it made, files created/modified, and any issues encountered
- Report progress to the user at each step transition
- **Do NOT ask for confirmation between cycles** — the workflow is automatic
- If an agent fails, report the error to the user and stop
- Track cycle count in `skills/CYCLE_COUNT.md` (create if doesn't exist, increment each cycle)
