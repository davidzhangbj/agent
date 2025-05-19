import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { tool } from 'ai';
import { z } from 'zod';
import { actionGetUserMcpServers } from '~/components/mcp/action';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';
// 导入json-schema-to-zod库
import { jsonSchemaToZod } from 'json-schema-to-zod';

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
        return await getToolsFromSSE(server);
        // return await loadToolsFromFile(server.filePath, server.args, server.env);
      })
    );

    return mcpServersTools.reduce((acc, tools) => ({ ...acc, ...tools }), {});
  } catch (error) {
    console.error('Error in getToolsFromMCPServer:', error);
    return [];
  }
}

// 保留原有的convertJsonSchemaToZod函数作为备用
function convertJsonSchemaToZod(schema: any): z.ZodTypeAny {
  // 处理 anyOf 情况
  if (schema.anyOf) {
    const schemas = schema.anyOf.map((s: any) => convertJsonSchemaToZod(s));
    return z.union(schemas);
  }

  if (schema.type === 'object') {
    const properties = schema.properties || {};
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const key in properties) {
      const prop = properties[key];
      let zodType = convertJsonSchemaToZod(prop);
      if (prop.default !== undefined) {
        zodType = zodType.default(prop.default);
      }
      if (!schema.required?.includes(key)) {
        zodType = zodType.optional();
      }
      shape[key] = zodType;
    }
    return z.object(shape);
  } else if (schema.type === 'string') {
    return z.string();
  } else if (schema.type === 'boolean') {
    return z.boolean();
  } else if (schema.type === 'number') {
    return z.number();
  } else if (schema.type === 'null') {
    return z.null();
  } else if (schema.type === 'array') {
    const itemsSchema = schema.items;
    const zodItems = convertJsonSchemaToZod(itemsSchema);
    return z.array(zodItems);
  }
  throw new Error(`Unsupported schema type: ${schema.type}`);
}

// 使用json-schema-to-zod库转换JSON Schema到Zod类型
function convertSchemaToZod(schema: any): z.ZodTypeAny {
  try {
    // 尝试使用json-schema-to-zod库
    // jsonSchemaToZod返回的是字符串形式的Zod代码，需要使用eval转换为Zod对象
    const zodSchemaCode = jsonSchemaToZod(schema, { module: 'cjs' });
    // 使用eval将字符串代码转换为Zod对象
    const zodSchema = eval(zodSchemaCode);
    return zodSchema;
  } catch (error) {
    console.warn('Error using jsonSchemaToZod, falling back to custom implementation:', error);
    // 如果失败，回退到自定义实现
    return convertJsonSchemaToZod(schema);
  }
}

async function getMCPClient(baseUrl: string) {
  let client: Client | undefined = undefined;
  try {
    client = new Client({
      name: 'streamable-http-client',
      version: '1.0.0'
    });
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl));
    await client.connect(transport);
    console.log('Connected using Streamable HTTP transport');
  } catch (error) {
    // If that fails with a 4xx error, try the older SSE transport
    console.log('Streamable HTTP connection failed, falling back to SSE transport');
    client = new Client({
      name: 'sse-client',
      version: '1.0.0'
    });
    const sseTransport = new SSEClientTransport(new URL(baseUrl));
    await client.connect(sseTransport);
  }
  return client;
}

async function getToolsFromSSE(server: UserMcpServer) {
  try {
    const client = await getMCPClient(server.filePath);
    const rawTools = await client.listTools();
    const rowToolsList = rawTools.tools;
    const wrappedTools = Object.entries(rowToolsList).reduce(
      (acc, [toolName, toolDef]) => {
        acc[toolDef.name] = tool({
          description: toolDef.description,
          parameters: convertSchemaToZod(toolDef.inputSchema), // 使用新的转换函数
          execute: async (args: Record<string, any>) => {
            try {
              const client = await getMCPClient(server.filePath);
              const result = await client.callTool({
                name: toolDef.name,
                arguments: args
              });
              return result;
            } catch (error) {
              console.error(`Error in call tools ${toolDef.name} from mcp server:`, error);
              // 返回错误信息而不是抛出错误，确保Chat能正确处理
              return { error: `MCP工具"${toolDef.name}"执行失败: ${error}` };
            }
          }
        });
        return acc;
      },
      {} as Record<string, any>
    );
    return wrappedTools;
  } catch (error) {
    console.error('Error in getToolsFromMCPServer:', error);
    return {};
  }
}

export async function getToolsFromMCPServer(server: UserMcpServer) {
  try {
    //used in mcp-view when getting mcp tools for non-enabled servers that are not in the db
    //later when in mcp-view the tools are allowed to be ran only if the mcp server is enabled
    return await getToolsFromSSE(server);
  } catch (error) {
    console.error('Error in getToolsFromMCPServer:', error);
    return {};
  }
}

// 导出工具集
export const userMCPToolset = {
  getTools: async (userId?: string) => {
    return await getToolsFromAllEnabledMCPServers(userId);
  }
};
