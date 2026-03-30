/**
 * Vercel AI SDK Backend for MiniMax
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct MiniMax API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { streamText, CoreTool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
import { ToolCall } from '../types';

interface FreeCADBridge {
  isConnected(): boolean;
  connect(): Promise<void>;
  executePython(code: string): Promise<{ success: boolean; output: string; error?: string }>;
}

export class VercelAIBackend implements AgentBackend {
  readonly name = 'minimax';
  readonly description = 'MiniMax via Vercel AI SDK';

  private config: BackendConfig = {};
  private freeCADBridge: FreeCADBridge | null = null;
  private sessionId: string = '';

  async initialize(config: BackendConfig): Promise<void> {
    this.config = {
      baseUrl: config.baseUrl || process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1',
      apiKey: config.apiKey || process.env.MINIMAX_API_KEY,
      model: config.model || process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
      temperature: config.temperature ?? (process.env.MINIMAX_TEMPERATURE ? parseFloat(process.env.MINIMAX_TEMPERATURE) : 0.7),
      maxTokens: config.maxTokens ?? (process.env.MINIMAX_MAX_TOKENS ? parseInt(process.env.MINIMAX_MAX_TOKENS, 10) : 4096),
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('MiniMax API key is required. Set MINIMAX_API_KEY environment variable.');
    }

    this.sessionId = this.generateSessionId();
    console.log(`[VercelAIBackend] Initialized session: ${this.sessionId}`);
    console.log(`[VercelAIBackend] Base URL: ${this.config.baseUrl}`);
    console.log(`[VercelAIBackend] Model: ${this.config.model}`);
  }

  private generateSessionId(): string {
    return `minimax-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
        error: 'MiniMax API key not configured',
      };
    }

    try {
      const messages = this.buildMessages(message, context);
      const mcpTools = await this.initializeMCPTools(tools);

      const model = openai(this.config.model || 'MiniMax-M2.7', {
        baseURL: this.config.baseUrl,
        apiKey: this.config.apiKey,
      });

      const result = streamText({
        model,
        messages,
        tools: mcpTools as Record<string, CoreTool<any, any>>,
        maxTokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
        onToolCall: async ({ toolCall }) => {
          const { id, name, args } = toolCall;
          console.log(`[VercelAIBackend] Executing tool: ${name}`, JSON.stringify(args).substring(0, 200));
          try {
            const toolResult = await this.executeViaBridge(name, args);
            return { toolCallId: id, result: toolResult };
          } catch (error) {
            console.error(`[VercelAIBackend] Tool execution failed for ${name}:`, error);
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
          console.log(`[VercelAIBackend] Tool result for ${delta.toolName}:`, JSON.stringify(delta.result).substring(0, 200));
          toolResults.set(delta.toolCallId, delta.result);
        } else if (delta.type === 'finish') {
          console.log(`[VercelAIBackend] Stream finished. Total content: ${fullContent.length} chars, Tool calls: ${toolCalls.length}`);
        } else if (delta.type === 'error') {
          console.error(`[VercelAIBackend] Stream error:`, delta.error);
        }
      }

      return {
        content: fullContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error) {
      console.error('[VercelAIBackend] Error:', error);
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

    console.log(`[VercelAIBackend] Initialized ${mcpTools.length} MCP tools`);
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
        return `import json
result = {
    'document_name': App.ActiveDocument.Name if App.ActiveDocument else None,
    'document_label': App.ActiveDocument.Label if App.ActiveDocument else None,
    'modified': App.ActiveDocument.Modified if App.ActiveDocument else None,
    'object_count': len(App.ActiveDocument.Objects) if App.ActiveDocument else 0
}
print(json.dumps(result))`;

      case 'list_objects':
        return `import json
objects = []
if App.ActiveDocument:
    for obj in App.ActiveDocument.Objects:
        objects.append({
            'name': obj.Name,
            'label': obj.Label,
            'type': obj.TypeId
        })
print(json.dumps(objects))`;

      case 'get_object_properties':
        return `import json
obj_name = ${JSON.stringify(args.objectName || '')}
if App.ActiveDocument and App.ActiveDocument.getObject(obj_name):
    obj = App.ActiveDocument.getObject(obj_name)
    props = {}
    for prop in obj.PropertiesList:
        props[prop] = str(getattr(obj, prop))
    print(json.dumps({'name': obj.Name, 'label': obj.Label, 'type': obj.TypeId, 'properties': props}))
else:
    print(json.dumps({'error': f'Object {obj_name} not found'}))`;

      case 'get_selection':
        return `import json
selection = []
if FreeCADGui and FreeCADGui.Selection:
    for obj in FreeCADGui.Selection.getSelection():
        selection.append({
            'name': obj.Name,
            'label': obj.Label,
            'type': obj.TypeId
        })
print(json.dumps(selection))`;

      case 'undo':
        return `import json
if App.ActiveDocument:
    App.ActiveDocument.undo()
    print(json.dumps({'success': True, 'message': 'Undo successful'}))
else:
    print(json.dumps({'success': False, 'error': 'No active document'}))`;

      case 'redo':
        return `import json
if App.ActiveDocument:
    App.ActiveDocument.redo()
    print(json.dumps({'success': True, 'message': 'Redo successful'}))
else:
    print(json.dumps({'success': False, 'error': 'No active document'}))`;

      case 'save_document':
        const filePath = args.filePath || 'AutoSave';
        return `import json
file_path = ${JSON.stringify(filePath)}
if App.ActiveDocument:
    App.ActiveDocument.save()
    if file_path != 'AutoSave':
        App.ActiveDocument.saveAs(file_path)
    print(json.dumps({'success': True, 'message': 'Document saved'}))
else:
    print(json.dumps({'success': False, 'error': 'No active document'}))`;

      default:
        return `print(json.dumps({'error': 'Unknown tool: ' + ${JSON.stringify(toolName)}}))`;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.sessionId = '';
    console.log('[VercelAIBackend] Disconnected');
  }
}
