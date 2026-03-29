## Status: IN PROGRESS (Cycle 16)

# Cycle 16: Kinematic Solver and Motion Animation Tools

## Overview

Enable the LLM to simulate and animate mechanical assemblies by driving kinematic joints and solving constraint-based mechanisms. Users describe "open this hinge 45 degrees" or "animate this piston-crank mechanism" and Claude executes the appropriate FreeCAD API calls to solve and visualize the motion.

Kinematic simulation is essential for mechanical design verification, range-of-motion analysis, and creating animated documentation.

## Prerequisites

- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- `src/Mod/LLMBridge/llm_bridge/` - Python bridge with existing handlers
- `src/Mod/LLMBridge/llm_bridge/assembly_handlers.py` - Existing assembly constraint handlers
- Basic assembly tools (create_assembly, add constraints)

## Tasks

### 1. Kinematic Solver Handler Module

**File**: `src/Mod/LLMBridge/llm_bridge/kinematic_handlers.py` (new file)

Create Python handlers for kinematic simulation:

```python
# Solver Control
def handle_initialize_solver(assembly_name) -> dict
def handle_solve_assembly(assembly_name, max_iterations) -> dict
def handle_check_dof(assembly_name) -> dict

# Joint/Driver Operations
def handle_set_joint_value(joint_name, value) -> dict
def handle_get_joint_value(joint_name) -> dict
def handle_add_drive(joint_name, start_value, end_value, duration, motion_type) -> dict

# Animation
def handle_animate_assembly(assembly_name, duration, frame_rate) -> dict
def handle_stop_animation() -> dict
def handle_get_animation_state() -> dict

# Kinematic Analysis
def handle_get_kinematic_positions(assembly_name) -> dict
def handle_check_collision(during_motion) -> dict
def handle_get_joint_limits(joint_name) -> dict
```

Key implementation details:
- Use FreeCAD's built-in solver (Assembly3Workbench solver or robotic module)
- Support degrees of freedom (DOF) analysis
- Implement joint drivers for animation
- Support linear and angular joint types
- Collision detection during motion
- Keyframe-based animation output

**Acceptance Criteria**:
- [ ] Solver initializes for assembly
- [ ] Joint values can be set and retrieved
- [ ] DOF count reported correctly
- [ ] Animation plays through duration

### 2. Kinematic Tools

**File**: `sidecar/src/agent-tools.ts`

Add tools for kinematic operations:

**Solver Tools:**
1. **`initialize_kinematic_solver`** - Initialize solver for assembly:
   - Parameters: `assemblyName`
   - Returns: `{success, assemblyName, dofCount, jointCount, message}`
   - Examples: "Initialize solver for this assembly", "Setup kinematic analysis"

2. **`solve_assembly`** - Solve kinematic positions:
   - Parameters: `assemblyName`, `maxIterations` (optional, default 100)
   - Returns: `{success, assemblyName, iterations, converged, positions, message}`
   - Examples: "Solve this mechanism", "Calculate positions"

3. **`checkDegreesOfFreedom`** - Check DOF analysis:
   - Parameters: `assemblyName`
   - Returns: `{success, assemblyName, totalDof, constrainedDof, freeDof, message}`
   - Examples: "Show DOF analysis", "How many degrees of freedom?"

**Joint Control Tools:**
4. **`set_joint_value`** - Set a joint/driver value:
   - Parameters: `jointName`, `value` (float, degrees or mm)
   - Returns: `{success, jointName, value, message}`
   - Examples: "Rotate hinge to 45 degrees", "Move slider 20mm"

5. **`get_joint_value`** - Get current joint value:
   - Parameters: `jointName`
   - Returns: `{success, jointName, value, unit, message}`
   - Examples: "What's the current angle?", "Show joint position"

6. **`get_joint_limits`** - Get joint limits:
   - Parameters: `jointName`
   - Returns: `{success, jointName, minValue, maxValue, unit, hasLimits, message}`
   - Examples: "Show joint limits", "Range of motion for this joint"

**Animation Tools:**
7. **`drive_joint`** - Create joint animation sequence:
   - Parameters: `jointName`, `startValue`, `endValue`, `duration` (float, seconds), `motionType` ("linear", "ease_in_out", "sine")
   - Returns: `{success, jointName, startValue, endValue, duration, frames, message}`
   - Examples: "Open hinge from 0 to 90 degrees over 2 seconds", "Animate crank rotation"

8. **`animate_assembly`** - Run full assembly animation:
   - Parameters: `assemblyName`, `duration` (float, seconds), `frameRate` (optional, default 30)
   - Returns: `{success, assemblyName, duration, totalFrames, message}`
   - Examples: "Animate the mechanism for 5 seconds", "Play full motion cycle"

9. **`stop_animation`** - Stop running animation:
   - Parameters: none
   - Returns: `{success, message}`
   - Examples: "Stop animation"

10. **`get_animation_state`** - Get current animation status:
    - Parameters: none
    - Returns: `{success, isPlaying, currentFrame, totalFrames, duration, message}`
    - Examples: "Is animation playing?", "Current animation status"

**Analysis Tools:**
11. **`get_kinematic_positions`** - Get all joint positions after solve:
    - Parameters: `assemblyName`
    - Returns: `{success, assemblyName, positions: [{joint, value, unit}], message}`
    - Examples: "Show all joint positions", "Current configuration"

12. **`check_collision`** - Check for collisions during motion:
    - Parameters: `assemblyName`
    - Returns: `{success, assemblyName, hasCollision, collisionPairs, message}`
    - Examples: "Check for collisions", "Any interference?"

**Acceptance Criteria**:
- [ ] All kinematic tools work correctly
- [ ] Solver converges for valid assemblies
- [ ] Animation plays smoothly
- [ ] Joint values update correctly

### 3. Python Bridge Extensions

**File**: `src/Mod/LLMBridge/llm_bridge/kinematic_handlers.py` (extend)

Add WebSocket-accessible wrapper functions:

```python
def handle_initialize_solver_request(assembly_name)
def handle_solve_request(assembly_name, max_iterations)
def handle_set_joint_request(joint_name, value)
def handle_add_drive_request(joint_name, start_value, end_value, duration, motion_type)
def handle_animate_request(assembly_name, duration, frame_rate)
# ... etc for all tools
```

These wrap the core handlers and add:
- Assembly validation
- Joint type detection
- Unit conversion (degrees/radians, mm/inches)
- Error handling for over-constrained or under-constrained assemblies
- Undo stack integration

**Acceptance Criteria**:
- [ ] Functions accessible via WebSocket
- [ ] Changes are undoable
- [ ] Errors reported clearly

### 4. Result Formatters Update

**File**: `sidecar/src/result-formatters.ts` (extend)

Add formatters for kinematic operations:

```typescript
function formatSolverInit(result: SolverInitResult): string
function formatSolveResult(result: SolveResult): string
function formatDOFResult(result: DOFResult): string
function formatJointValue(result: JointValueResult): string
function formatJointLimits(result: JointLimitsResult): string
function formatDriveResult(result: DriveResult): string
function formatAnimationResult(result: AnimationResult): string
function formatKinematicPositions(result: PositionsResult): string
function formatCollisionResult(result: CollisionResult): string
```

Output should be human-readable:
- "Solver initialized: 3 DOF, 5 joints"
- "Solved in 12 iterations, converged: true"
- "Hinge joint: 45.0 degrees (range: 0-180)"
- "Animation: 5.0s, 150 frames"
- "No collisions detected"
- "Positions: {Hinge: 45°, Slider: 20mm}"

**Acceptance Criteria**:
- [ ] Results are concise but informative
- [ ] Units shown clearly
- [ ] Success/failure clearly indicated

### 5. Sidecar README Update

**File**: `sidecar/README.md`

Document the new tools:
- Tool names and parameters
- Kinematic workflow reference
- Usage examples for each tool type
- Common mechanisms (hinges, sliders, crank-slider, etc.)

**Acceptance Criteria**:
- [ ] All new tools documented
- [ ] Examples cover common kinematic scenarios
- [ ] Reference tables included

### 6. Test End-to-End

**Test Scenarios**:

1. **Solver Init**:
   - Command: "Initialize solver for MainAssembly"
   - Verify: Returns DOF count and joint count

2. **Set Joint Value**:
   - Command: "Rotate the hinge joint to 45 degrees"
   - Verify: Joint value updates, assembly recomputes

3. **Drive Joint Animation**:
   - Command: "Drive hinge from 0 to 90 degrees over 2 seconds"
   - Verify: Animation created with correct keyframes

4. **Full Animation**:
   - Command: "Animate the mechanism for 5 seconds"
   - Verify: All joints move through their driven values

5. **DOF Analysis**:
   - Command: "Show degrees of freedom"
   - Verify: Reports correct constrained/free DOF

6. **Collision Check**:
   - Command: "Check for collisions"
   - Verify: Reports any interference

7. **Slider Mechanism**:
   - Command: "Move the slider 30mm"
   - Verify: Linear joint updates correctly

8. **Crank-Slider**:
   - Command: "Rotate crank 360 degrees and show animation"
   - Verify: Piston moves accordingly

9. **Error Case - No Solver**:
   - Command: "Solve without initializing"
   - Verify: Clear error message

10. **Error Case - Over-constrained**:
    - Command: "Solve over-constrained assembly"
    - Verify: Reports convergence failure

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Solver converges for valid assemblies
- [ ] Animation plays correctly
- [ ] Error messages are actionable

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/kinematic_handlers.py` - Kinematic solver handlers

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add 12 kinematic tools
2. `sidecar/src/result-formatters.ts` - Add formatters for kinematic results
3. `sidecar/README.md` - Document kinematic tools
4. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Register new handlers

## Dependencies

- FreeCAD Assembly workbench (Assembly3, A2plus, or built-in)
- FreeCAD solver infrastructure
- Existing WebSocket bridge infrastructure
- Assembly constraint tools (already implemented)

## Out of Scope

This plan does NOT include:
- Path-based motion (follow trajectory)
- Force/torque analysis
- Dynamic simulation (masses, springs, dampers)
- Inverse kinematics (IK) solving
- Export to motion simulation formats
- FEA integration

## Definition of Done

- [ ] Kinematic handler module complete
- [ ] All 12 kinematic tools implemented
- [ ] Solver initialization works
- [ ] Joint control works
- [ ] Animation plays correctly
- [ ] Results formatted clearly
- [ ] End-to-end tests pass
- [ ] Documentation updated
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once Kinematic Solver and Motion Animation tools are complete:
- Add animation and rendering tools (export animations as GIF/MP4)
- Add mesh/conversion tools for 3D printing workflows
- Add advanced rendering tools (raytracing, material assignment)
