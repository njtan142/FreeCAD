/**
 * Google Gemini Backend via Vercel AI SDK
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct Google Gemini API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { streamText, CoreTool } from 'ai';
import { google } from '@ai-sdk/google';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
import { ToolCall } from '../types';

interface FreeCADBridge {
  isConnected(): boolean;
  connect(): Promise<void>;
  executePython(code: string): Promise<{ success: boolean; output: string; error?: string }>;
}

export class GeminiBackend implements AgentBackend {
  readonly name = 'gemini';
  readonly description = 'Google Gemini via Vercel AI SDK';

  private config: BackendConfig = {};
  private freeCADBridge: FreeCADBridge | null = null;
  private sessionId: string = '';

  async initialize(config: BackendConfig): Promise<void> {
    this.config = {
      baseUrl: config.baseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      model: config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      temperature: config.temperature ?? (process.env.GEMINI_TEMPERATURE ? parseFloat(process.env.GEMINI_TEMPERATURE) : 0.7),
      maxTokens: config.maxTokens ?? (process.env.GEMINI_MAX_TOKENS ? parseInt(process.env.GEMINI_MAX_TOKENS, 10) : 4096),
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable.');
    }

    this.sessionId = this.generateSessionId();
    console.log(`[GeminiBackend] Initialized session: ${this.sessionId}`);
    console.log(`[GeminiBackend] Base URL: ${this.config.baseUrl}`);
    console.log(`[GeminiBackend] Model: ${this.config.model}`);
  }

  private generateSessionId(): string {
    return `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  setFreeCADBridge(bridge: FreeCADBridge): void {
    this.freeCADBridge = bridge;
  }

  async sendMessage(
    message: string,
    context: MessageContext,
    tools: MCPTool[],
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse> {
    if (!this.config.apiKey) {
      return {
        content: '',
        error: 'Gemini API key not configured',
      };
    }

    try {
      const messages = this.buildMessages(message, context);
      const mcpTools = await this.initializeMCPTools(tools);

      const model = google(this.config.model || 'gemini-2.0-flash', {
        baseURL: this.config.baseUrl,
        apiKey: this.config.apiKey,
      });

      const result = streamText({
        model,
        messages,
        tools: mcpTools as Record<string, CoreTool<any, any>>,
        maxTokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
        onToolCall: async ({ toolCall }: { toolCall: { id: string; name: string; args: Record<string, any> } }) => {
          const { id, name, args } = toolCall;
          console.log(`[GeminiBackend] Executing tool: ${name}`, JSON.stringify(args).substring(0, 200));
          try {
            const toolResult = await this.executeViaBridge(name, args);
            return { toolCallId: id, result: toolResult };
          } catch (error) {
            console.error(`[GeminiBackend] Tool execution failed for ${name}:`, error);
            return { toolCallId: id, result: { error: error instanceof Error ? error.message : String(error) } };
          }
        },
      });

      let fullContent = '';
      let toolCalls: ToolCall[] = [];
      let toolResults: Map<string, any> = new Map();

      for await (const delta of result.fullStream) {
        if (delta.type === 'text-delta') {
          fullContent += delta.textDelta;
          onChunk(delta.textDelta);
        } else if (delta.type === 'tool-call') {
          toolCalls.push({
            id: delta.toolCall.id,
            name: delta.toolCall.name,
            arguments: delta.toolCall.args,
          });
        } else if (delta.type === 'tool-result') {
          console.log(`[GeminiBackend] Tool result for ${delta.toolName}:`, JSON.stringify(delta.result).substring(0, 200));
          toolResults.set(delta.toolCallId, delta.result);
        } else if (delta.type === 'finish') {
          console.log(`[GeminiBackend] Stream finished. Total content: ${fullContent.length} chars, Tool calls: ${toolCalls.length}`);
        } else if (delta.type === 'error') {
          console.error(`[GeminiBackend] Stream error:`, delta.error);
        }
      }

      return {
        content: fullContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error) {
      console.error('[GeminiBackend] Error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private buildMessages(message: string, context: MessageContext): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    const systemPrompt = `You are a FreeCAD CAD assistant. You help users create, modify, and query 3D models in FreeCAD.

IMPORTANT: You have access to MCP tools from the FreeCAD MCP server. ALWAYS use these MCP tools when needed. NEVER use Bash, Read, Grep, Write, Glob, Edit, or other file/code tools unless explicitly asked to analyze code.

Your primary tool is "execute_freecad_python" — it runs Python code directly inside FreeCAD's live interpreter with full access to all FreeCAD APIs:
- FreeCAD (App), FreeCADGui (Gui)
- Part, PartDesign, Sketcher, Draft, Arch, Path, TechDraw, FEM, Mesh, Spreadsheet
- All workbenches and modules

Use execute_freecad_python for ALL CAD operations: creating geometry, modifying objects, boolean operations, assemblies, BIM elements, sketches, etc.

Other helper tools: query_model_state, list_objects, get_object_properties, get_selection, undo, redo, save_document.

When creating objects, always call doc.recompute() after modifications. Use print(json.dumps(...)) to return structured results.

Be concise and helpful in your responses.`;

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    if (context.documentInfo) {
      const contextMsg = `Document: ${context.documentInfo.label} (${context.documentInfo.name})
Modified: ${context.documentInfo.modified}
Objects: ${context.documentInfo.objectCount}`;
      messages.push({ role: 'user', content: contextMsg });
    }

    if (context.selectedObjects && context.selectedObjects.length > 0) {
      const selectedMsg = 'Selected Objects:\n' +
        context.selectedObjects.map((obj) => `- ${obj.label} (${obj.type})`).join('\n');
      messages.push({ role: 'user', content: selectedMsg });
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      for (const msg of context.conversationHistory.slice(0, -1)) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: message,
    });

    return messages;
  }

  private async initializeMCPTools(tools: MCPTool[]): Promise<any[]> {
    const mcpTools: any[] = [];

    for (const tool of tools) {
      mcpTools.push({
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      });
    }

    console.log(`[GeminiBackend] Initialized ${mcpTools.length} MCP tools`);
    return mcpTools;
  }

  private async executeViaBridge(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.freeCADBridge) {
      throw new Error('FreeCAD bridge not available');
    }

    if (toolName === 'execute_freecad_python') {
      const code = args.code || args.script;
      if (!code) {
        return { success: false, output: '', error: 'No code provided' };
      }

      if (!this.freeCADBridge.isConnected()) {
        await this.freeCADBridge.connect();
      }

      return await this.freeCADBridge.executePython(code);
    }

    const code = this.buildToolCode(toolName, args);
    if (!this.freeCADBridge.isConnected()) {
      await this.freeCADBridge.connect();
    }
    return await this.freeCADBridge.executePython(code);
  }

  private buildToolCode(toolName: string, args: Record<string, any>): string {
    const argsJson = JSON.stringify(args);
    switch (toolName) {
      case 'query_model_state':
        return this.buildQueryModelStateCode(args);

      case 'list_objects':
        return `import json
try:
    from llm_bridge.query_handlers import handle_list_objects
    result = handle_list_objects()
    print(json.dumps(result))
except ImportError:
    objects = []
    if App.ActiveDocument:
        for obj in App.ActiveDocument.Objects:
            objects.append({
                'name': obj.Name,
                'label': obj.Label,
                'type': obj.TypeId
            })
    print(json.dumps({'success': True, 'data': objects}))`;

      case 'get_object_properties':
        return `import json
obj_name = ${JSON.stringify(args.objectName || '')}
try:
    from llm_bridge.query_handlers import handle_get_object_properties
    result = handle_get_object_properties(obj_name)
    print(json.dumps(result))
except ImportError:
    if App.ActiveDocument and App.ActiveDocument.getObject(obj_name):
        obj = App.ActiveDocument.getObject(obj_name)
        props = {}
        for prop in obj.PropertiesList:
            props[prop] = str(getattr(obj, prop))
        print(json.dumps({'success': True, 'name': obj.Name, 'label': obj.Label, 'type': obj.TypeId, 'properties': props}))
    else:
        print(json.dumps({'success': False, 'error': f'Object {obj_name} not found'}))`;

      case 'get_selection':
        return `import json
try:
    from llm_bridge.query_handlers import handle_selection
    result = handle_selection()
    print(json.dumps(result))
except ImportError:
    selection = []
    if FreeCADGui and FreeCADGui.Selection:
        for obj in FreeCADGui.Selection.getSelection():
            selection.append({
                'name': obj.Name,
                'label': obj.Label,
                'type': obj.TypeId
            })
    print(json.dumps({'success': True, 'data': selection}))`;

      case 'undo':
        return `import json
try:
    from llm_bridge.query_handlers import handle_undo
    result = handle_undo()
    print(json.dumps(result))
except ImportError:
    if App.ActiveDocument:
        App.ActiveDocument.undo()
        print(json.dumps({'success': True, 'message': 'Undo successful'}))
    else:
        print(json.dumps({'success': False, 'error': 'No active document'}))`;

      case 'redo':
        return `import json
try:
    from llm_bridge.query_handlers import handle_redo
    result = handle_redo()
    print(json.dumps(result))
except ImportError:
    if App.ActiveDocument:
        App.ActiveDocument.redo()
        print(json.dumps({'success': True, 'message': 'Redo successful'}))
    else:
        print(json.dumps({'success': False, 'error': 'No active document'}))`;

      case 'save_document':
        return this.buildSaveDocumentCode(args);

      case 'open_document':
        return `import json
try:
    from llm_bridge.file_handlers import handle_open_document
    result = handle_open_document(${JSON.stringify(args.filePath || '')})
    print(json.dumps(result))
except ImportError:
    file_path = ${JSON.stringify(args.filePath || '')}
    if file_path and file_path.strip():
        try:
            FreeCAD.open(file_path)
            print(json.dumps({'success': True, 'message': f'Opened {file_path}'}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))
    else:
        print(json.dumps({'success': False, 'error': 'No file path provided'}))`;

      case 'export_to_format':
        return `import json
try:
    from llm_bridge.file_handlers import handle_export_to_format
    result = handle_export_to_format(${JSON.stringify(args.filePath || '')}, ${JSON.stringify(args.format || 'STEP')})
    print(json.dumps(result))
except ImportError:
    file_path = ${JSON.stringify(args.filePath || '')}
    format = ${JSON.stringify(args.format || 'STEP')}.upper()
    if not App.ActiveDocument:
        print(json.dumps({'success': False, 'error': 'No active document'}))
    elif not file_path:
        print(json.dumps({'success': False, 'error': 'No file path provided'}))
    else:
        try:
            import Part
            objects = [obj for obj in App.ActiveDocument.Objects if hasattr(obj, 'Shape')]
            if format == 'STEP':
                Part.export(objects, file_path)
            elif format == 'STL':
                import Mesh
                meshes = []
                for obj in objects:
                    mesh = Mesh.Mesh(obj.Shape.tessellate(0.01))
                    meshes.append(mesh)
                if meshes:
                    Mesh.export(meshes, file_path)
                else:
                    print(json.dumps({'success': False, 'error': 'No meshable objects found'}))
                    return
            else:
                print(json.dumps({'success': False, 'error': f'Format {format} not supported via fallback'}))
                return
            print(json.dumps({'success': True, 'filePath': file_path, 'format': format}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))`;

      case 'get_document_info':
        return `import json
try:
    from llm_bridge.query_handlers import handle_get_document_info
    result = handle_get_document_info()
    print(json.dumps(result))
except ImportError:
    if App.ActiveDocument:
        print(json.dumps({
            'success': True,
            'documentName': App.ActiveDocument.Name,
            'documentLabel': App.ActiveDocument.Label,
            'modified': App.ActiveDocument.Modified,
            'objectCount': len(App.ActiveDocument.Objects)
        }))
    else:
        print(json.dumps({'success': False, 'error': 'No active document'}))`;

      case 'list_recent_documents':
        return `import json
try:
    from llm_bridge.file_handlers import handle_list_recent_documents
    result = handle_list_recent_documents()
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_new_document':
        return `import json
try:
    from llm_bridge.file_handlers import handle_create_new_document
    result = handle_create_new_document(${JSON.stringify(args.name || null)}, ${JSON.stringify(args.type || 'Part')})
    print(json.dumps(result))
except ImportError:
    try:
        doc = FreeCAD.newDocument(${JSON.stringify(args.name || '')})
        print(json.dumps({'success': True, 'documentName': doc.Name, 'documentLabel': doc.Label}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))`;

      case 'create_sketch':
        return `import json
try:
    from llm_bridge.sketcher_handlers import handle_create_sketch
    result = handle_create_sketch(${JSON.stringify(args.name || null)}, ${JSON.stringify(args.attachmentObject || null)}, ${JSON.stringify(args.attachmentMode || 'FlatFace')})
    print(json.dumps(result))
except ImportError:
    try:
        doc = App.ActiveDocument
        if not doc:
            print(json.dumps({'success': False, 'error': 'No active document'}))
        else:
            sketch = doc.addObject('Sketcher::SketchObject', ${JSON.stringify(args.name || 'Sketch')})
            if ${JSON.stringify(args.attachmentObject || null)}:
                att_obj = doc.getObject(${JSON.stringify(args.attachmentObject)})
                if att_obj:
                    sketch.AttachmentSupport = [att_obj]
            doc.recompute()
            print(json.dumps({'success': True, 'name': sketch.Name, 'label': sketch.Label}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))`;

      case 'add_sketch_geometry':
        return `import json
try:
    from llm_bridge.sketcher_handlers import handle_add_geometry
    result = handle_add_geometry(${JSON.stringify(args.sketchName || '')}, ${JSON.stringify(args.geometryType || 'Line')}, ${JSON.stringify(args.parameters || {})})
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_body':
        return `import json
try:
    from llm_bridge.feature_handlers import handle_create_body
    result = handle_create_body(${JSON.stringify(args.name || null)})
    print(json.dumps(result))
except ImportError:
    try:
        doc = App.ActiveDocument
        if not doc:
            print(json.dumps({'success': False, 'error': 'No active document'}))
        else:
            body = doc.addObject('PartDesign::Body', ${JSON.stringify(args.name || 'Body')})
            print(json.dumps({'success': True, 'name': body.Name, 'label': body.Label}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))`;

      case 'set_active_body':
        return `import json
try:
    from llm_bridge.feature_handlers import handle_set_active_body
    result = handle_set_active_body(${JSON.stringify(args.bodyName || '')})
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_pad':
        return `import json
try:
    from llm_bridge.feature_handlers import handle_create_pad
    result = handle_create_pad(${JSON.stringify(args.bodyName || '')}, ${JSON.stringify(args.length || '10mm')}, ${JSON.stringify(args.sketchName || null)})
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_pocket':
        return `import json
try:
    from llm_bridge.feature_handlers import handle_create_pocket
    result = handle_create_pocket(${JSON.stringify(args.bodyName || '')}, ${JSON.stringify(args.length || '10mm')}, ${JSON.stringify(args.sketchName || null)})
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'boolean_fuse':
      case 'boolean_cut':
      case 'boolean_common':
        return `import json
try:
    from llm_bridge.boolean_handlers import handle_${toolName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}
    result = handle_${toolName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}(${JSON.stringify(args.objectName || '')}, ${JSON.stringify(args.toolName || '')})
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_point':
      case 'create_line':
      case 'create_circle':
      case 'create_arc':
      case 'create_ellipse':
      case 'create_rectangle':
      case 'create_polygon':
      case 'create_bspline':
      case 'create_wire':
        return `import json
try:
    from llm_bridge.draft_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'move_object':
      case 'rotate_object':
      case 'scale_object':
        return `import json
try:
    from llm_bridge.property_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'set_object_property':
        return `import json
try:
    from llm_bridge.property_handlers import handle_set_object_property
    result = handle_set_object_property(${JSON.stringify(args.objectName || '')}, ${JSON.stringify(args.propertyName || '')}, ${JSON.stringify(args.value || '')})
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_linear_pattern':
      case 'create_polar_pattern':
      case 'create_rectangular_pattern':
      case 'create_path_pattern':
        return `import json
try:
    from llm_bridge.pattern_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_assembly':
      case 'add_component_to_assembly':
      case 'remove_component_from_assembly':
      case 'list_assemblies':
      case 'list_assembly_components':
        return `import json
try:
    from llm_bridge.assembly_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'add_coincident_constraint':
      case 'add_parallel_constraint':
      case 'add_perpendicular_constraint':
      case 'add_angle_constraint':
      case 'add_distance_constraint':
      case 'add_tangent_constraint':
        return `import json
try:
    from llm_bridge.assembly_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_drawing_page':
      case 'create_standard_view':
      case 'create_isometric_view':
      case 'create_front_view':
      case 'create_top_view':
      case 'create_side_view':
      case 'create_section_view':
        return `import json
try:
    from llm_bridge.techdraw_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_loft':
      case 'create_sweep':
      case 'create_pipe':
        return `import json
try:
    from llm_bridge.surface_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'initialize_kinematic_solver':
      case 'solve_assembly':
      case 'check_degrees_of_freedom':
      case 'set_joint_value':
      case 'get_joint_value':
        return `import json
try:
    from llm_bridge.kinematic_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'set_view_angle':
      case 'zoom_to_fit':
      case 'set_camera_position':
        return `import json
try:
    from llm_bridge.view_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'render_view':
        return `import json
try:
    from llm_bridge.render_handlers import handle_render_view
    params = json.loads('${argsJson}')
    result = handle_render_view(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'shape_to_mesh':
      case 'mesh_to_shape':
      case 'mesh_boolean_union':
      case 'mesh_boolean_difference':
      case 'mesh_boolean_intersection':
      case 'decimate_mesh':
      case 'validate_mesh':
        return `import json
try:
    from llm_bridge.mesh_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_fea_analysis':
      case 'create_fea_mesh':
      case 'set_fea_material':
      case 'add_fea_fixed_constraint':
      case 'add_fea_force_constraint':
      case 'run_fea_analysis':
      case 'get_fea_displacement':
        return `import json
try:
    from llm_bridge.fea_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_path_job':
      case 'create_path_profile':
      case 'create_path_pocket':
      case 'create_path_drill':
      case 'export_gcode':
        return `import json
try:
    from llm_bridge.path_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_spreadsheet':
      case 'set_cell':
      case 'get_cell':
        return `import json
try:
    from llm_bridge.spreadsheet_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_wall':
      case 'create_window':
      case 'create_door':
      case 'create_roof':
      case 'create_stairs':
        return `import json
try:
    from llm_bridge.bim_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'measure_distance':
      case 'measure_angle':
        return `import json
try:
    from llm_bridge.measurement_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'save_chat_session':
      case 'load_chat_session':
      case 'list_chat_sessions':
        return `print(json.dumps({'error': 'Tool ${toolName} is not supported via the Gemini backend. Use the Claude or OpenCode backend for session management operations.'}))`;

      default:
        return `print(json.dumps({'error': 'Tool ${toolName} is not yet supported via the Gemini backend. Use execute_freecad_python for this operation or use the Claude/OpenCode backend.'}))`;
    }
  }

  private buildQueryModelStateCode(args: Record<string, any>): string {
    const intent = args.intent || 'document_overview';
    switch (intent) {
      case 'document_overview':
        return `import json
try:
    from llm_bridge.query_handlers import handle_document_overview
    result = handle_document_overview()
    print(json.dumps(result))
except ImportError:
    objects = []
    if App.ActiveDocument:
        for obj in App.ActiveDocument.Objects:
            objects.append({
                'name': obj.Name,
                'label': obj.Label,
                'type': obj.TypeId,
                'visible': obj.ViewObject.Visibility if hasattr(obj, 'ViewObject') else True
            })
    print(json.dumps({'success': True, 'data': objects}))`;
      case 'object_details':
        return `import json
obj_name = ${JSON.stringify(args.objectName || '')}
try:
    from llm_bridge.query_handlers import handle_object_details
    result = handle_object_details(obj_name)
    print(json.dumps(result))
except ImportError:
    if App.ActiveDocument and App.ActiveDocument.getObject(obj_name):
        obj = App.ActiveDocument.getObject(obj_name)
        print(json.dumps({'success': True, 'data': {
            'name': obj.Name,
            'label': obj.Label,
            'type': obj.TypeId,
            'placement': str(obj.Placement) if hasattr(obj, 'Placement') else None
        }}))
    else:
        print(json.dumps({'success': False, 'error': f'Object {obj_name} not found'}))`;
      case 'selection':
        return `import json
try:
    from llm_bridge.query_handlers import handle_selection
    result = handle_selection()
    print(json.dumps(result))
except ImportError:
    selection = []
    if FreeCADGui and FreeCADGui.Selection:
        for obj in FreeCADGui.Selection.getSelection():
            selection.append({'name': obj.Name, 'label': obj.Label, 'type': obj.TypeId})
    print(json.dumps({'success': True, 'data': selection}))`;
      case 'dependencies':
        return `import json
obj_name = ${JSON.stringify(args.objectName || '')}
try:
    from llm_bridge.query_handlers import handle_dependencies
    result = handle_dependencies(obj_name)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'Dependency tracking requires MCP connection'}))`;
      default:
        return `print(json.dumps({'success': False, 'error': 'Unknown intent: ' + ${JSON.stringify(intent)}}))`;
    }
  }

  private buildSaveDocumentCode(args: Record<string, any>): string {
    const filePath = args.filePath || 'AutoSave';
    const format = args.format || 'FCStd';
    return `import json
try:
    from llm_bridge.file_handlers import handle_save_document
    result = handle_save_document(${JSON.stringify(filePath)}, ${JSON.stringify(format)})
    print(json.dumps(result))
except ImportError:
    file_path = ${JSON.stringify(filePath)}
    if App.ActiveDocument:
        try:
            if file_path == 'AutoSave':
                App.ActiveDocument.save()
                print(json.dumps({'success': True, 'message': 'Document saved'}))
            else:
                App.ActiveDocument.saveAs(file_path)
                print(json.dumps({'success': True, 'filePath': file_path, 'message': f'Document saved to {file_path}'}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))
    else:
        print(json.dumps({'success': False, 'error': 'No active document'}))`;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models?key=${this.config.apiKey}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.sessionId = '';
    console.log('[GeminiBackend] Disconnected');
  }
}
