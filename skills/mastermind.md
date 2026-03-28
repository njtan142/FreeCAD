# Mastermind Skill

You are an orchestrator that runs the plan → implement → review cycle automatically.

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
- If review verdict is **PASS**: report success to the user, the cycle is complete
- If review verdict is **NEEDS_FIXES**: spawn another implement agent with the review fixes as additional context, then re-run code review
- Maximum 2 fix cycles before stopping and reporting to the user

## Rules

- Each agent runs with fresh context — pass it everything it needs via the skill file
- Do NOT do the work yourself — delegate to agents
- Report progress to the user at each step transition
- After the full cycle completes, ask the user if they want to run another cycle
