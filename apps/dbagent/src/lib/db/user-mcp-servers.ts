'use server';

import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { DBAccess } from '~/lib/db/db';
import { mcpServers } from '~/lib/db/schema-sqlite';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';

export async function dbGetUserMcpServers(dbAccess: DBAccess) {
  return await dbAccess.query(async ({ db }) => {
    const results = await db.select().from(mcpServers);
    return results;
  });
}

export async function dbGetUserMcpServer(dbAccess: DBAccess, serverName: string) {
  return await dbAccess.query(async ({ db }) => {
    const result = await db.select().from(mcpServers).where(eq(mcpServers.name, serverName)).limit(1);

    return result[0];
  });
}

//might need to update this for version and filepath aswell
export async function dbUpdateUserMcpServer(dbAccess: DBAccess, input: UserMcpServer) {
  return await dbAccess.query(async ({ db }) => {
    const result = await db
      .update(mcpServers)
      .set({
        enabled: input.enabled ? 1 : 0
      })
      .where(eq(mcpServers.name, input.name))
      .returning();

    if (result.length === 0) {
      throw new Error(`[UPDATE]Server with name "${input.name}" not found`);
    }

    return result[0];
  });
}

export async function dbAddUserMcpServerToDB(dbAccess: DBAccess, input: UserMcpServer): Promise<UserMcpServer> {
  return await dbAccess.query(async ({ db }) => {
    // Check if server with same name exists
    const existingServer = await db.select().from(mcpServers).where(eq(mcpServers.name, input.name)).limit(1);

    if (existingServer.length > 0) {
      throw new Error(`Server with name "${input.name}" already exists`);
    }

    // Create new server
    const result = await db
      .insert(mcpServers)
      .values({
        name: input.name,
        serverName: input.name,
        version: input.version,
        filePath: input.filePath,
        enabled: input.enabled ? 1 : 0,
        env: input.env ? JSON.stringify(input.env) : null,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      })
      .returning();

    const server = result[0];

    if (!server) {
      throw new Error('Failed to create server');
    }

    return {
      name: server.name,
      version: server.version,
      filePath: server.filePath,
      enabled: server.enabled === 1 ? true : false,
      args: server.args,
      env: server.env ? JSON.parse(server.env) : undefined
    };
  });
}

export async function dbDeleteUserMcpServer(dbAccess: DBAccess, serverName: string): Promise<void> {
  return await dbAccess.query(async ({ db }) => {
    const result = await db.delete(mcpServers).where(eq(mcpServers.name, serverName)).returning();

    if (result.length === 0) {
      throw new Error(`Server with name "${serverName}" not found`);
    }
  });
}
