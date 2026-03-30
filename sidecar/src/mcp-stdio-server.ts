/**
 * MCP Stdio Server for FreeCAD Tools
 *
 * Standalone MCP server that exposes FreeCAD tools over stdio transport.
 * Claude CLI connects to this via --mcp-config.
 * This server proxies tool calls through the sidecar's HTTP endpoint (port 8767)
 * which already has the WebSocket connection to FreeCAD.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as http from 'http';

const PROXY_PORT = parseInt(process.env.FREECAD_PROXY_PORT || '8767', 10);

function executePython(code: string): Promise<{ output: string; success: boolean; error?: string }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ code });
    const req = http.request({
      hostname: 'localhost',
      port: PROXY_PORT,
      path: '/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            output: parsed.output || parsed.stdout || '',
            success: parsed.success !== false,
            error: parsed.error,
          });
        } catch {
          resolve({ output: data, success: true });
        }
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.write(body);
    req.end();
  });
}

function parseLastJsonLine(output: string): { success: boolean; data: any; error?: string } {
  if (!output || !output.trim()) {
    return { success: false, data: null, error: 'No output' };
  }
  const lines = output.trim().split('\n').filter(l => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      return {
        success: parsed.success !== false,
        data: parsed.data || parsed,
        error: parsed.error,
      };
    } catch {
      continue;
    }
  }
  return { success: true, data: { raw: output }, error: undefined };
}

async function main() {
  const server = new McpServer({
    name: 'freecad-tools',
    version: '1.0.0',
  });

  // Core tool: execute arbitrary Python in FreeCAD
  server.tool(
    'execute_freecad_python',
    `Execute Python code in FreeCAD's environment. Use this to create, modify, or query CAD models.
The code runs in FreeCAD's Python interpreter with access to FreeCAD, Part, Draft, Arch, and all other modules.
Always call doc.recompute() after creating or modifying objects.`,
    { code: z.string().describe('Python code to execute in FreeCAD') },
    async ({ code }) => {
      try {
        const result = await executePython(code);
        return {
          content: [{ type: 'text' as const, text: result.output || result.error || 'Code executed (no output)' }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Query model state
  server.tool(
    'query_model_state',
    'Get comprehensive information about the current FreeCAD document including all objects, their types, properties, and relationships.',
    {},
    async () => {
      const code = `from llm_bridge.query_handlers import handle_model_state; import json; result = handle_model_state(); print(json.dumps(result))`;
      try {
        const result = await executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [{ type: 'text' as const, text: parsed.success ? JSON.stringify(parsed.data, null, 2) : `Error: ${parsed.error}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // List objects
  server.tool(
    'list_objects',
    'List all objects in the active FreeCAD document with their names, labels, types, and visibility.',
    {},
    async () => {
      const code = `from llm_bridge.query_handlers import handle_list_objects; import json; result = handle_list_objects(); print(json.dumps(result))`;
      try {
        const result = await executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [{ type: 'text' as const, text: parsed.success ? JSON.stringify(parsed.data, null, 2) : `Error: ${parsed.error}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Get object properties
  server.tool(
    'get_object_properties',
    'Get all properties of a specific object in the FreeCAD document.',
    { objectName: z.string().describe('Name of the object to inspect') },
    async ({ objectName }) => {
      const code = `from llm_bridge.query_handlers import handle_object_properties; import json; result = handle_object_properties("${objectName}"); print(json.dumps(result))`;
      try {
        const result = await executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [{ type: 'text' as const, text: parsed.success ? JSON.stringify(parsed.data, null, 2) : `Error: ${parsed.error}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Get selection
  server.tool(
    'get_selection',
    'Get the currently selected objects in the FreeCAD viewport.',
    {},
    async () => {
      const code = `from llm_bridge.query_handlers import handle_selection; import json; result = handle_selection(); print(json.dumps(result))`;
      try {
        const result = await executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [{ type: 'text' as const, text: parsed.success ? JSON.stringify(parsed.data, null, 2) : `Error: ${parsed.error}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Undo
  server.tool(
    'undo',
    'Undo the last operation in FreeCAD.',
    {},
    async () => {
      try {
        const result = await executePython(`import FreeCAD as App; doc = App.ActiveDocument; doc.undo(); doc.recompute(); print('Undo done')`);
        return { content: [{ type: 'text' as const, text: result.output || 'Undo performed' }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  // Redo
  server.tool(
    'redo',
    'Redo the last undone operation in FreeCAD.',
    {},
    async () => {
      try {
        const result = await executePython(`import FreeCAD as App; doc = App.ActiveDocument; doc.redo(); doc.recompute(); print('Redo done')`);
        return { content: [{ type: 'text' as const, text: result.output || 'Redo performed' }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  // Save document
  server.tool(
    'save_document',
    'Save the current FreeCAD document.',
    { filePath: z.string().optional().describe('Optional file path for Save As') },
    async ({ filePath }) => {
      const code = filePath
        ? `import FreeCAD as App; doc = App.ActiveDocument; doc.saveAs("${filePath.replace(/\\/g, '\\\\')}"); print('Saved')`
        : `import FreeCAD as App; doc = App.ActiveDocument; doc.save(); print('Saved')`;
      try {
        const result = await executePython(code);
        return { content: [{ type: 'text' as const, text: result.output || 'Document saved' }] };
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  console.error('[MCP-Stdio] Starting stdio transport...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP-Stdio] Server connected and ready');
}

main().catch((err) => {
  console.error('[MCP-Stdio] Fatal error:', err);
  process.exit(1);
});
