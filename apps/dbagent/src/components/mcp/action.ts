'use server';

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { getMCPSourceDir } from '~/lib/ai/tools/user-mcp';
import { getUserDBAccess } from '~/lib/db/db';
import { MCPServer } from '~/lib/db/schema';
import {
  dbAddUserMcpServerToDB,
  dbDeleteUserMcpServer,
  dbGetUserMcpServer,
  dbGetUserMcpServers,
  dbUpdateUserMcpServer
} from '~/lib/db/user-mcp-servers';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';

const execAsync = promisify(exec);

//playbook db insert
export async function actionAddUserMcpServerToDB(input: UserMcpServer, asUserId?: string): Promise<UserMcpServer> {
  // console.log('adding user mcp server {userMcpServer: ', input, '}');
  const dbAccess = await getUserDBAccess(asUserId);
  return await dbAddUserMcpServerToDB(dbAccess, input);
}

export async function actionCheckUserMcpServerExists(serverName: string, asUserId?: string): Promise<boolean> {
  // console.log(`checking if mcp server exists {serverName: ${serverName}}`);
  const dbAccess = await getUserDBAccess(asUserId);
  const result = await dbGetUserMcpServer(dbAccess, serverName);

  if (result) {
    try {
      await fs.stat(result.filePath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function actionUpdateUserMcpServer(input: UserMcpServer, asUserId?: string) {
  // console.log('updating user mcp server {userMcpServer: ', input, '}');
  const dbAccess = await getUserDBAccess(asUserId);
  return await dbUpdateUserMcpServer(dbAccess, input);
}

export async function actionGetUserMcpServer(serverName: string, asUserId?: string): Promise<UserMcpServer | null> {
  // console.log(`getting user mcp server {serverName: ${serverName}}`);
  const dbAccess = await getUserDBAccess(asUserId);
  const server = await dbGetUserMcpServer(dbAccess, serverName);
  if (!server) return null;
  return {
    name: server.name,
    version: server.version,
    filePath: server.filePath,
    enabled: server.enabled,
    args: server.args,
    env: server.env ? JSON.parse(server.env) : undefined
  };
}

export async function actionGetUserMcpServers(asUserId?: string): Promise<UserMcpServer[]> {
  const dbAccess = await getUserDBAccess(asUserId);
  const servers = await dbGetUserMcpServers(dbAccess);
  return servers.map((server) => ({
    name: server.name,
    version: server.version,
    filePath: server.filePath,
    enabled: server.enabled,
    args: server.args,
    env: server.env ? JSON.parse(server.env) : undefined
  }));
}

export async function actionDeleteUserMcpServerFromDBAndFiles(serverName: string, asUserId?: string): Promise<void> {
  const dbAccess = await getUserDBAccess(asUserId);

  // Get the server details before deleting from DB
  const server = await dbGetUserMcpServer(dbAccess, serverName);
  if (server) {
    await dbDeleteUserMcpServer(dbAccess, serverName);
  }

  // Delete the files
  const mcpSourceDir = getMCPSourceDir();

  try {
    await execAsync(`pnpm uninstall --dir ${mcpSourceDir} ${server?.name}`);
  } catch (error) {
    console.error('Error deleting server files:', error);
    // Don't throw the error since the DB deletion was successful
  }
}
