import { NextResponse } from 'next/server';
import { actionGetUserMcpServer } from '~/components/mcp/action';

export async function GET(request: Request, { params }: { params: Promise<{ server: string }> }) {
  try {
    const { server } = await params;

    const mcpServer = await actionGetUserMcpServer(server);

    return NextResponse.json(mcpServer);
  } catch (error) {
    console.error('Error reading server file:', error);
    return NextResponse.json({ error: 'Failed to read server file' }, { status: 500 });
  }
}
