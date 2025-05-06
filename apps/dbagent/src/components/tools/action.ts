'use server';

import { getDBClusterTools } from '~/lib/ai/tools/cluster';
import { commonToolset } from '~/lib/ai/tools/common';
import { getDBSQLTools } from '~/lib/ai/tools/db';
import { getPlaybookToolset } from '~/lib/ai/tools/playbook';
import { getCustomQueryTools } from '~/lib/ai/tools/query';
import { mergeToolsets } from '~/lib/ai/tools/types';
import { userMCPToolset } from '~/lib/ai/tools/user-mcp';
import { getConnection, listConnections } from '~/lib/db/connections';
import { dbDeleteCustomToolByName, dbGetCustomToolByName } from '~/lib/db/custom-tool';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { MCPServer } from '~/lib/db/schema';
import { getTargetDbPool } from '~/lib/targetdb/db';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';
import { requireUserSession } from '~/utils/route';

export interface Tool {
  name: string;
  description: string;
  isBuiltIn: boolean;
  customType?: 'MCP' | 'QUERY';
}

export async function actionGetConnections(projectId: string) {
  try {
    const dbAccess = await getUserSessionDBAccess();
    return await listConnections(dbAccess, projectId);
  } catch (error) {
    console.error('Error getting connections:', error);
    return [];
  }
}

export async function actionGetBuiltInAndCustomTools(connectionId: string): Promise<Tool[]> {
  try {
    const [builtInTools, customTools] = await Promise.all([
      actionGetBuiltInTools(connectionId),
      actionGetCustomTools(connectionId)
    ]);
    return [...customTools, ...builtInTools];
  } catch (error) {
    console.error('Error getting tools:', error);
    return [];
  }
}

export async function actionGetBuiltInTools(connectionId: string): Promise<Tool[]> {
  try {
    await requireUserSession();
    const dbAccess = await getUserSessionDBAccess();
    const connection = await getConnection(dbAccess, connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Get SQL tools
    const targetDb = getTargetDbPool(connection.connectionString);
    const dbTools = getDBSQLTools(targetDb);

    // Get cluster tools
    const clusterTools = getDBClusterTools(dbAccess, connection, 'aws'); // Default to AWS for now

    // Get playbook tools
    const playbookToolset = getPlaybookToolset(dbAccess, connection.projectId);

    // Merge all built-in toolsets
    const mergedTools = mergeToolsets(commonToolset, playbookToolset, dbTools, clusterTools);

    // Convert to array format
    return Object.entries(mergedTools).map(([name, tool]) => ({
      name,
      description: tool.description || 'No description available',
      isBuiltIn: true
    }));
  } catch (error) {
    console.error('Error getting built-in tools:', error);
    return [];
  }
}

export async function actionGetCustomTools(connectionId: string): Promise<Tool[]> {
  try {
    const userId = await requireUserSession();
    const dbAccess = await getUserSessionDBAccess();
    const connection = await getConnection(dbAccess, connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Get SQL tools
    const targetDb = getTargetDbPool(connection.connectionString);

    // Get MCP tools
    const mcpTools = await userMCPToolset.getTools(userId);
    // Get Custom Query tools
    const customTools = await getCustomQueryTools(targetDb);

    // Convert to array format
    return Object.entries(customTools)
      .map(([name, tool]) => ({
        name,
        description: tool.description || 'No description available',
        isBuiltIn: false,
        customType: 'QUERY'
      }))
      .concat(
        Object.entries(mcpTools).map(([name, tool]) => ({
          name,
          description: tool.description || 'No description available',
          isBuiltIn: false,
          customType: 'MCP'
        }))
      );
  } catch (error) {
    console.error('Error getting custom tools:', error);
    return [];
  }
}

export async function actionGetCustomToolsFromMCPServer(server: UserMcpServer): Promise<Tool[]> {
  try {
    const mcpTools = await userMCPToolset.getToolsFromMCPServer(server);
    return Object.entries(mcpTools).map(([name, tool]) => ({
      name,
      description: tool.description || 'No description available',
      isBuiltIn: false
    }));
  } catch (error) {
    console.error('Error getting custom tools from MCP server:', error);
    return [];
  }
}

export async function actionDeleteCustomQueryToolByName(name: string) {
  const dbAccess = await getUserSessionDBAccess();
  await dbDeleteCustomToolByName(dbAccess, { name });
  return;
}

export async function actionGetCustomQueryToolByName(name: string) {
  const dbAccess = await getUserSessionDBAccess();
  return dbGetCustomToolByName(dbAccess, { name });
}
