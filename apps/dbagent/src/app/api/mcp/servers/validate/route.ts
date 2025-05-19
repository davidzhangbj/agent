import { NextResponse } from 'next/server';
import { getMCPClient } from '~/components/mcp/mcp-client';

export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();

    const { client, message } = await getMCPClient(filePath);
    if (!client) {
      return NextResponse.json({ message: message }, { status: 500 });
    }
    return NextResponse.json(
      { message: 'SSE mcp server available,tools:' + JSON.stringify(client.listTools()) },
      { status: 200 }
    );
  } catch (e) {
    console.log(`Validate sse mcp server failed: ${String(e)}`);
    return NextResponse.json({ message: `SSE mcp server unavailable: ${String(e)}` }, { status: 500 });
  }
}
