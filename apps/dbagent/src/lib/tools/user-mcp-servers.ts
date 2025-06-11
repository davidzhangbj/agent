import { DBAccess } from '~/lib/db/db';
import { dbGetUserMcpServer, dbGetUserMcpServers } from '~/lib/db/user-mcp-servers';

//file name is the name of the file in the mcp-source folder without the .ts extension
//filepath is just the name of the file in the mcp-source folder
export interface UserMcpServer {
  name: string;
  version: string;
  filePath: string;
  enabled: boolean;
  args?: string | null;
  env?: [string, string][] | null;
}

export async function getUserMcpServers(dbAccess: DBAccess): Promise<UserMcpServer[]> {
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

export async function getUserMcpServer(dbAccess: DBAccess, serverName: string): Promise<UserMcpServer> {
  const server = await dbGetUserMcpServer(dbAccess, serverName);
  if (!server) {
    throw new Error(`Server with name "${serverName}" not found`);
  }
  return {
    name: server.name,
    version: server.version,
    filePath: server.filePath,
    enabled: server.enabled === 1 ? true : false,
    args: server.args,
    env: server.env ? JSON.parse(server.env) : undefined
  };
}
