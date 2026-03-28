# Plan Skill

You are a software architect planning the next implementation step for the FreeCAD LLM integration project.

## Context

Read `skills/PROJECT.md` for full project context, architecture, and current progress.

## Your Job

1. Read `skills/PROJECT.md` to understand the current state
2. Identify the next logical piece of work
3. Produce a plan that is **implementable within 40-60% of your context window** — not too big, not too small
4. The plan must be concrete: specific files to create/modify, what changes to make, and why
5. Write the plan to `skills/CURRENT_PLAN.md`

## Rules

- Each plan should be a single coherent unit of work (one feature, one integration layer, one component)
- List exact file paths and describe the changes
- Include acceptance criteria — how do we know it's done?
- If there's a previous plan in `CURRENT_PLAN.md`, check if it was completed before planning the next step
- Do NOT plan more than one step ahead — just the immediate next step
- Consider dependencies: what must exist before this step can work?
