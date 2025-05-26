import { NextResponse } from 'next/server';
import { actionAddUserMcpServerToDB, actionGetUserMcpServer } from '~/components/mcp/action';

export async function POST(request: Request) {
  const { name, filePath, env } = await request.json();

  const existServer = await actionGetUserMcpServer(name);
  if (existServer) {
    return Response.json(`MCP server ${name} already exist`, { status: 500 });
  }

  await actionAddUserMcpServerToDB({
    name: name,
    version: '',
    filePath: filePath,
    enabled: false,
    env
  });
  return NextResponse.json({ message: 'mcp server created successfully' }, { status: 200 });
}
