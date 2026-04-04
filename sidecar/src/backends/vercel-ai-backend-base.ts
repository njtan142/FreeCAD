/**
 * Vercel AI SDK Backend Base Class
 *
 * Contains all shared code for Vercel AI SDK backends (MiniMax, Gemini, OpenAI-compatible).
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { streamText, Tool, ModelMessage, jsonSchema, stepCountIs } from 'ai';
import { z } from 'zod';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend.js';
import { ToolCall } from '../types.js';

export interface FreeCADBridge {
  isConnected(): boolean;
  connect(): Promise<void>;
  executePython(code: string): Promise<{ success: boolean; output: string; error?: string }>;
}

export abstract class VercelAIBackendBase implements AgentBackend {
  readonly name: string;
  readonly description: string;

  protected config: BackendConfig = {};
  protected freeCADBridge: FreeCADBridge | null = null;
  protected sessionId: string = '';

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  protected abstract getConfigPrefix(): string;
  protected abstract validateApiKey(): void;
  protected abstract createModel(): any;
  protected abstract buildHealthCheckUrl(): string;

  async initialize(config: BackendConfig): Promise<void> {
    const prefix = this.getConfigPrefix();
    this.config = {
      baseUrl: config.baseUrl || process.env[`${prefix}BASE_URL`] as string || this.getDefaultBaseUrl(),
      apiKey: config.apiKey || process.env[`${prefix}API_KEY`] as string,
      model: config.model || process.env[`${prefix}MODEL`] as string || this.getDefaultModel(),
      temperature: config.temperature ?? (process.env[`${prefix}TEMPERATURE`] ? parseFloat(process.env[`${prefix}TEMPERATURE`]!) : 0.7),
      maxTokens: config.maxTokens ?? (process.env[`${prefix}MAX_TOKENS`] ? parseInt(process.env[`${prefix}MAX_TOKENS`]!, 10) : 4096),
      ...config,
    };

    this.validateApiKey();

    this.sessionId = this.generateSessionId();
    console.log(`[${this.name}] Initialized session: ${this.sessionId}`);
    console.log(`[${this.name}] Base URL: ${this.config.baseUrl}`);
    console.log(`[${this.name}] Model: ${this.config.model}`);
  }

  protected getDefaultBaseUrl(): string {
    return 'https://api.minimaxi.com/v1';
  }

  protected getDefaultModel(): string {
    return 'MiniMax-M2.7';
  }

  protected generateSessionId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
        error: `${this.name} API key not configured`,
      };
    }

    try {
      const messages = this.buildMessages(message, context);
      const mcpTools = await this.initializeMCPTools(tools);

      const model = this.createModel();

      console.log(`[${this.name}] Sending request with ${Object.keys(mcpTools).length} tools`);

      const result = await streamText({
        model,
        messages: messages as ModelMessage[],
        tools: mcpTools as any,
        maxOutputTokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
        stopWhen: stepCountIs(10),
      });

      let fullContent = '';
      let toolCalls: ToolCall[] = [];

      for await (const delta of result.fullStream) {
        if (delta.type === 'text-delta') {
          fullContent += delta.text;
          onChunk(delta.text);
        } else if (delta.type === 'tool-call') {
          console.log(`[${this.name}] Tool call: ${delta.toolName}`);
          toolCalls.push({
            id: delta.toolCallId,
            name: delta.toolName,
            arguments: delta.input,
          });
        } else if (delta.type === 'tool-result') {
          console.log(`[${this.name}] Tool result for ${(delta as any).toolName}:`, String((delta as any).result).substring(0, 200));
        } else if (delta.type === 'finish') {
          console.log(`[${this.name}] Stream finished. Content: ${fullContent.length} chars, Tool calls: ${toolCalls.length}`);
        }
      }

      return {
        content: fullContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return {
        content: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  protected buildMessages(message: string, context: MessageContext): ModelMessage[] {
    const messages: ModelMessage[] = [];

    const systemPrompt = `You are a FreeCAD CAD assistant. You help users create, modify, and query 3D models in FreeCAD.

You have access to a large set of structured MCP tools from the FreeCAD MCP server. ALWAYS prefer the most specific tool available for the task:
- Sketching: create_sketch, add sketch constraints/geometry tools
- PartDesign: create_body, create_pad, create_pocket, create_revolution, create_groove, create_fillet, create_chamfer
- Primitives and geometry: use the dedicated shape tools when available
- Patterns: linear_pattern, polar_pattern, rectangular_pattern
- Queries: list_objects, get_object_properties, query_model_state, get_selection, get_document_info
- Transforms: move_object, rotate_object, scale_object
- Document: save_document, new_document, open_document, export_to_format

Only fall back to "execute_freecad_python" when no dedicated tool exists for the operation. It runs arbitrary Python inside FreeCAD's live interpreter and has full API access, but structured tools are preferred.

If a tool call fails, read the error, correct your approach, and try again — do not give up after one failure.

NEVER assume object names. Call list_objects first if you need to reference an existing object by name.

CRITICAL — when using execute_freecad_python:
- Solids: Part.makeBox(), Part.makeCylinder(), Part.makeSphere() — NOT Part.Shape.makeBox()
- Add to document: obj = doc.addObject("Part::Feature", "Name"); obj.Shape = shape
- Boolean: Part.fuse(s1, s2), Part.cut(s1, s2), Part.common(s1, s2)
- Always call doc.recompute() after changes

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

  protected async initializeMCPTools(tools: MCPTool[]): Promise<Record<string, any>> {
    const mcpTools: Record<string, any> = {};

    for (const tool of tools) {
      const schema = tool.inputSchema || { type: 'object', properties: {} };
      const toolName = tool.name;
      mcpTools[toolName] = {
        description: tool.description,
        parameters: jsonSchema(schema),
        execute: async (args: Record<string, any>) => {
          try {
            const result = await this.executeViaBridge(toolName, args);
            return JSON.stringify(result);
          } catch (error) {
            return JSON.stringify({ success: false, error: String(error) });
          }
        },
      };
    }

    console.log(`[${this.name}] Initialized ${Object.keys(mcpTools).length} MCP tools`);
    return mcpTools;
  }

  protected async executeViaBridge(toolName: string, args: Record<string, any>): Promise<any> {
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

  protected buildToolCode(toolName: string, args: Record<string, any>): string {
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

      case 'add_geometric_constraint':
      case 'add_dimensional_constraint':
      case 'set_constraint_value':
      case 'list_sketch_constraints':
      case 'delete_constraint':
      case 'get_sketch_geometry':
        return `import json
try:
    from llm_bridge.sketcher_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
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

      case 'update_feature':
      case 'replace_sketch':
      case 'delete_feature':
        return `import json
try:
    from llm_bridge.feature_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
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

      case 'create_linear_dimension':
      case 'create_radial_dimension':
      case 'create_angular_dimension':
      case 'create_ordinate_dimension':
      case 'create_text':
      case 'create_dimension_text':
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

      case 'move':
      case 'rotate':
      case 'scale':
      case 'offset':
      case 'join':
      case 'split':
        return `import json
try:
    from llm_bridge.draft_handlers import handle_${toolName}
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

      case 'create_transform_link':
      case 'update_linear_pattern':
      case 'update_polar_pattern':
      case 'get_pattern_info':
      case 'delete_pattern':
      case 'list_patterns':
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

      case 'add_insert_constraint':
      case 'add_equal_constraint':
      case 'add_symmetric_constraint':
      case 'update_constraint_value':
      case 'remove_constraint':
      case 'list_constraints':
      case 'suppress_constraint':
      case 'activate_constraint':
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
      case 'create_cylinder':
      case 'create_box':
      case 'create_sphere':
      case 'create_cone':
      case 'create_torus':
      case 'create_prism':
      case 'create_helix':
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
      case 'add_joint':
      case 'remove_joint':
      case 'get_kinematic_errors':
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
      case 'reset_view':
      case 'toggle_orthographic':
      case 'toggle_perspective':
        return `import json
try:
    from llm_bridge.view_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'render_view':
      case 'set_render_quality':
      case 'apply_material':
      case 'export_animation':
        return `import json
try:
    from llm_bridge.render_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
    print(json.dumps(result))
except ImportError:
    print(json.dumps({'success': False, 'error': 'This tool requires MCP connection'}))`;

      case 'create_animation':
      case 'add_keyframe':
      case 'play_animation':
      case 'export_animation_video':
      case 'export_images':
        return `import json
try:
    from llm_bridge.animation_export_handlers import handle_${toolName}
    params = json.loads('${argsJson}')
    result = handle_${toolName}(**params)
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
      case 'repair_mesh':
      case 'check_mesh':
      case 'refine_mesh':
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

      case 'get_fea_stress':
      case 'get_fea_reaction':
      case 'create_fea_mechanical_constraint':
      case 'set_fea_pressure':
      case 'run_fea_static_analysis':
      case 'run_fea_modal_analysis':
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

      case 'create_path_helix':
      case 'create_path_circle':
      case 'create_path_line':
      case 'add_path_leade':
      case 'add_path_extension':
      case 'create_path_fixture':
      case 'simulate_path':
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

      case 'create_column':
      case 'create_beam':
      case 'create_slab':
      case 'create_building':
      case 'create_space':
      case 'add_annotation':
      case 'create_schedule':
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
        return `print(json.dumps({'error': 'Tool ${toolName} is not supported via the ${this.name} backend. Use the Claude or OpenCode backend for session management operations.'}))`;

      default:
        return `print(json.dumps({'error': 'Tool ${toolName} is not yet supported via the ${this.name} backend. Use execute_freecad_python for this operation or use the Claude/OpenCode backend.'}))`;
    }
  }

  protected buildQueryModelStateCode(args: Record<string, any>): string {
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

  protected buildSaveDocumentCode(args: Record<string, any>): string {
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
      const url = this.buildHealthCheckUrl();
      const response = await fetch(url, this.getHealthCheckHeaders());
      return response.ok;
    } catch {
      return false;
    }
  }

  protected getHealthCheckHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  async disconnect(): Promise<void> {
    this.sessionId = '';
    console.log(`[${this.name}] Disconnected`);
  }
}
