import { experimental_createMCPClient } from 'ai'; //,
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import path from 'path';
import { actionGetUserMcpServers } from '~/components/mcp/action';
import { env } from '~/lib/env/server';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';

export function getMCPSourceDistDir() {
  const baseDir = env.MCP_SOURCE_DIR || 'mcp-source';
  return path.join(process.cwd(), baseDir, 'dist');
}

export function getMCPSourceDir() {
  const baseDir = env.MCP_SOURCE_DIR || 'mcp-source';
  return path.join(process.cwd(), baseDir);
}

async function getToolsFromAllEnabledMCPServers(userId?: string) {
  //gets all the enabled mcp servers tools by checking the enabled status from the db
  try {
    const servers = await actionGetUserMcpServers(userId);

    //gets mcp server file and looks at the enabled status of the server
    const mcpServersTools = await Promise.all(
      servers.map(async (server) => {
        if (!server.enabled) {
          return {};
        }
        //loads the tools from the mcp server file only if the server is enabled
        return await loadToolsFromFile(server.filePath, server.args, server.env);
      })
    );

    return mcpServersTools.reduce((acc, tools) => ({ ...acc, ...tools }), {});
  } catch (error) {
    console.error('Error in getToolsFromMCPServer:', error);
    return {};
  }
}

async function getToolsFromMCPServer(server: UserMcpServer) {
  try {
    //used in mcp-view when getting mcp tools for non-enabled servers that are not in the db
    //later when in mcp-view the tools are allowed to be ran only if the mcp server is enabled
    return await loadToolsFromFile(server.filePath, server.args, server.env);
  } catch (error) {
    console.error('Error in getToolsFromMCPServer:', error);
    return {};
  }
}

async function loadToolsFromFile(filePath: string, args?: string | null, env?: [string, string][] | null) {
  const transportArgs = args ? [filePath, args] : [filePath];

  try {
    const transport = new Experimental_StdioMCPTransport({
      command: 'node',
      args: transportArgs,
      env: env?.reduce((acc, record) => ({ ...acc, [record[0]]: record[1] }), {})
    });

    const client = await experimental_createMCPClient({
      transport
    });

    const toolSet = await client.tools();
    return toolSet || {};
  } catch (error) {
    console.error(`Error loading tools for ${filePath}:`, error);
    return {};
  }
}

export const userMCPToolset = {
  getTools: async (userId?: string) => {
    const tools = await getToolsFromAllEnabledMCPServers(userId);
    return tools;
  },
  getToolsFromMCPServer: async (server: UserMcpServer) => {
    const tools = await getToolsFromMCPServer(server);
    return tools;
  }
};
