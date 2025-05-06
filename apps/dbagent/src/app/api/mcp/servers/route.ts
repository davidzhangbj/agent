import { NextResponse } from 'next/server';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { getUserMcpServers } from '~/lib/tools/user-mcp-servers';

export async function GET() {
  const dbAccess = await getUserSessionDBAccess();

  try {
    const servers = await getUserMcpServers(dbAccess);
    return NextResponse.json(servers);
  } catch (error) {
    console.error('Error reading MCP servers:', error);
    return NextResponse.json({ error: 'Failed to read MCP servers' }, { status: 500 });
  }
}
