'use server';

// import { exec } from 'child_process';
// import { promisify } from 'util';
import { getUserDBAccess } from '~/lib/db/db';
import {
  dbAddUserMcpServerToDB,
  dbDeleteUserMcpServer,
  dbGetUserMcpServer,
  dbGetUserMcpServers,
  dbUpdateUserMcpServer
} from '~/lib/db/user-mcp-servers';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';

// const execAsync = promisify(exec);

//playbook db insert
export async function actionAddUserMcpServerToDB(input: UserMcpServer, asUserId?: string): Promise<UserMcpServer> {
  // console.log('adding user mcp server {userMcpServer: ', input, '}');
  const dbAccess = await getUserDBAccess(asUserId);
  return await dbAddUserMcpServerToDB(dbAccess, input);
}

export async function actionCheckUserMcpServerExists(_serverName: string, _asUserId?: string): Promise<boolean> {
  // console.log(`checking if mcp server exists {serverName: ${serverName}}`);
  // const dbAccess = await getUserDBAccess(asUserId);
  // const result = await dbGetUserMcpServer(dbAccess, serverName);

  // TODO：根据不同类型的 mcp 检查
  return true;
}

export async function actionUpdateUserMcpServer(input: UserMcpServer, asUserId?: string) {
  // console.log('updating user mcp server {userMcpServer: ', input, '}');
  const dbAccess = await getUserDBAccess(asUserId);
  return await dbUpdateUserMcpServer(dbAccess, input);
}

export async function actionDeleteUserMcpServerFromDB(serverName: string, asUserId?: string) {
  const dbAccess = await getUserDBAccess(asUserId);
  return await dbDeleteUserMcpServer(dbAccess, serverName);
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
    enabled: server.enabled === 1 ? true : false,
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
    enabled: server.enabled === 1 ? true : false,
    args: server.args,
    env: server.env ? JSON.parse(server.env) : undefined
  }));
}
