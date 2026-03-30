/**
 * MCP Stdio Server for FreeCAD Tools
 *
 * Standalone MCP server that exposes FreeCAD tools over stdio transport.
 * Claude CLI connects to this via --mcp-config.
 * This server proxies tool calls through the sidecar's HTTP endpoint (port 8767)
 * which already has the WebSocket connection to FreeCAD.
 */
export {};
//# sourceMappingURL=mcp-stdio-server.d.ts.map