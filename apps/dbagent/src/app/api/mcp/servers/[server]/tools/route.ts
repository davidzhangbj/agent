import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ server: string }> }) {
  try {
    const { server } = await params;

    let client: Client | undefined = undefined;
    const baseUrl = new URL(args);
    try {
      client = new Client({
        name: 'streamable-http-client',
        version: '1.0.0'
      });
      const transport = new StreamableHTTPClientTransport(new URL(baseUrl));
      await client.connect(transport);
      console.log('Connected using Streamable HTTP transport');
    } catch (error) {
      // If that fails with a 4xx error, try the older SSE transport
      console.log('Streamable HTTP connection failed, falling back to SSE transport');
      client = new Client({
        name: 'sse-client',
        version: '1.0.0'
      });
      const sseTransport = new SSEClientTransport(baseUrl);
      await client.connect(sseTransport);
      const tools = await client.listTools();
      return NextResponse.json({ message: 'SSE mcp server available,tools:' + JSON.stringify(tools) }, { status: 200 });
    }
  } catch (e) {
    console.log(`Validate sse mcp server failed: ${String(e)}`);
    return NextResponse.json({ message: `SSE mcp server unavailable: ${String(e)}` }, { status: 500 });
  }
}
