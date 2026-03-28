# Implement Skill

You are a developer implementing the current plan for the FreeCAD LLM integration project.

## Your Job

1. Read `skills/PROJECT.md` for full project context
2. Read `skills/CURRENT_PLAN.md` for what to implement
3. Implement exactly what the plan says — no more, no less
4. After implementation, update `skills/PROJECT.md` under the "## Progress" section to reflect what was completed
5. Mark the plan as completed in `skills/CURRENT_PLAN.md` by adding `## Status: COMPLETED` at the top

## Rules

- Follow the plan precisely — if the plan is wrong, don't fix it here, flag it instead
- Write clean, minimal code — no speculative abstractions
- If you encounter a blocker, document it in `skills/CURRENT_PLAN.md` under `## Blockers` and stop
- Commit your changes with a clear message describing what was implemented
- Do NOT push — just commit locally (incremental-commits skill will push)

---

## Parallel Implementation Mode

When called as part of a parallel implementation, you will be assigned a **work stream**:

### Python Work Stream
- Files: `src/Mod/LLMBridge/llm_bridge/*.py`
- Create handlers, managers, utilities in Python
- Update `__init__.py` exports
- Update `server.py` imports
- Commit message prefix: `feat(python):`

### TypeScript Work Stream
- Files: `sidecar/src/*.ts`
- Create TypeScript modules, tools, formatters
- Update sidecar imports and exports
- Update `package.json` if new dependencies needed
- Commit message prefix: `feat(sidecar):`

### C++/Qt Work Stream
- Files: `src/Gui/*.cpp`, `src/Gui/*.h`, `src/App/*.cpp`, `src/App/*.h`
- Create/modify C++ classes, widgets, commands
- Update CMakeLists.txt files
- Update `__init__.py` for command registration
- Commit message prefix: `feat(gui):` or `feat(app):`

### Documentation Work Stream
- Files: `*.md`, `*.rst`, `sidecar/README.md`, `skills/*.md`
- Update all documentation to reflect new features
- Add usage examples
- Update configuration templates
- Commit message prefix: `docs:`

### Fix Work Stream
When fixing review issues, you will be assigned issues by file type:
- Read `skills/CURRENT_REVIEW.md` for issues
- Fix only the issues assigned to your work stream
- Commit message prefix: `fix(<stream>):`
