// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { trackShipmentTool } from "./tools/track-shipment.ts";
import { listCouriersTool } from "./tools/list-couriers.ts";

// Create MCP server
const server = new Server(
  { name: "aftership-tracking", version: "0.1.0" },
  { capabilities: { tools: { list: true, call: true } } }
);

// Advertise tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: trackShipmentTool.name,
        description: trackShipmentTool.description,
        inputSchema: trackShipmentTool.input_schema,
      },
      {
        name: listCouriersTool.name,
        description: listCouriersTool.description,
        inputSchema: listCouriersTool.input_schema,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === trackShipmentTool.name) {
    const result = await trackShipmentTool.handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result ?? null) }],
    };
  }

  if (name === listCouriersTool.name) {
    const result = await listCouriersTool.handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result ?? null) }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start stdio transport
// IMPORTANT: do not log to stdout; use stderr if you want boot logs
console.error("[aftership] MCP server starting…");
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[aftership] MCP server running");
