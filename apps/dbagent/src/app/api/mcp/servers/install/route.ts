import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import * as path from 'path';
import { promisify } from 'util';
import { actionAddUserMcpServerToDB, actionGetUserMcpServer } from '~/components/mcp/action';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { name, args, env } = await request.json();

  const mcpSourceDir = path.join(process.cwd(), 'mcp-source');

  try {
    await fs.access(mcpSourceDir);
  } catch {
    console.log(
      'MCP source directory does not exist. Please ensure the mcp-source directory is present in the project root.'
    );
    return NextResponse.json('Failed to install MCP server', { status: 500 });
  }

  console.log('Installing MCP server:', name);

  const existServer = await actionGetUserMcpServer(name);
  if (existServer) {
    return Response.json(`MCP server ${name} already exist`, { status: 500 });
  }

  try {
    await execAsync(`pnpm install --dir ${mcpSourceDir} ${name}`);
  } catch (error) {
    console.error('Error installing MCP server:', error);
    return NextResponse.json('Failed to install MCP server', { status: 500 });
  }

  try {
    const pkgPath = path.join(mcpSourceDir, 'node_modules', name, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);

    let entryPath: string;

    if (pkg.main) {
      entryPath = path.join(mcpSourceDir, 'node_modules', name, pkg.main);
    } else if (pkg.bin) {
      // 只有 bin 文件
      const binPath = Object.values(pkg.bin)?.[0] as string;
      entryPath = path.join(mcpSourceDir, 'node_modules', name, binPath);
    } else {
      entryPath = path.join(mcpSourceDir, 'node_modules', name, 'index.js');
    }

    await actionAddUserMcpServerToDB({
      name: name,
      version: pkg.version,
      filePath: entryPath,
      enabled: false,
      args,
      env,
    });
    return NextResponse.json({ message: 'File uploaded and built successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json('Failed to install MCP server', { status: 500 });
  }
}
