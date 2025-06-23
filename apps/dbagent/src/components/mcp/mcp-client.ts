'use server';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export async function getMCPClient(sseUrl: string): Promise<{ client: Client | undefined; message: string }> {
  try {
    let client: Client | undefined = undefined;
    const baseUrl = new URL(sseUrl);
    try {
      client = new Client({
        name: 'sse-client',
        version: '1.0.0'
      });
      const sseTransport = new SSEClientTransport(baseUrl);
      await client.connect(sseTransport);
      return { client, message: '' };
    } catch (error) {
      // If that fails with a 4xx error, try the older SSE transport
      console.log('SSE connection failed, falling back to Streamable HTTP connection');
      client = new Client({
        name: 'streamable-http-client',
        version: '1.0.0'
      });
      const transport = new StreamableHTTPClientTransport(new URL(baseUrl));
      await client.connect(transport);
      console.log('Connected using Streamable HTTP transport');
      return { client, message: '' };
    }
  } catch (e) {
    console.log(`connect sse mcp server ${sseUrl} failed: ${String(e)}`);
    return { client: undefined, message: String(e) };
  }
}
