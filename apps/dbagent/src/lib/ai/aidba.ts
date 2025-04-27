import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1, Tool } from 'ai';
import { z } from 'zod';
import { Connection } from '~/lib/db/connections';
import {
  getSqlLockWaitTimeout,
  getSqlOfBlockTrx,
  getSqlOfHoldLockTrx,
  getTrxOfBlock,
  getTrxOfHoldLock
} from '~/lib/targetdb/db-oceanbase';
import { getTablesAndInstanceInfo, toolFindTableSchema } from '~/lib/tools/dbinfo';
import { getPlaybook, listPlaybooks } from '~/lib/tools/playbooks';
import { toolDescribeTable, toolExplainQuery, toolGetSlowQueries } from '~/lib/tools/slow-queries';
import { toolQueryRAG } from '../tools/rag';

export const commonSystemPrompt = `
You are an AI assistant expert in OceanBase database administration.
Your name is OceanBase Assistant.
Always answer SUCCINCTLY and to the point.
Be CONCISE.
`;

export const chatSystemPrompt = `${commonSystemPrompt}
Provide clear, concise, and accurate responses to questions.
Use the provided tools to get context from the OceanBase database to answer questions.
When asked to run a playbook, use the getPlaybook tool to get the playbook contents. Then use the contents of the playbook as an action plan. Execute the plan step by step.

You should use the [toolQueryRAG] tool to get the oceanbase contents for each step of the playbook if necessay.
[toolQueryRAG] tool can give you all the information about oceanbase database.
`;

export const monitoringSystemPrompt = `${commonSystemPrompt}
You are now executing a periodic monitoring task.
You are provided with a playbook name and a set of tools that you can use to execute the playbook.
First thing you need to do is call the getPlaybook tool to get the playbook contents.
Then use the contents of the playbook as an action plan. Execute the plan step by step.
At the end of your execution, print a summary of the results.
`;

export async function getTools(connection: Connection, asUserId?: string): Promise<Record<string, Tool>> {
  return {
    getCurrentTime: {
      description: 'Get the current time',
      parameters: z.object({}),
      execute: async () => {
        const now = new Date();
        return now.toLocaleTimeString();
      }
    },
    getSlowQueries: {
      description: ` Contains request time the query was called,
elapsed time in milliseconds, the execution time in milliseconds, and the query sql itself.`,
      parameters: z.object({}),
      execute: async () => {
        console.log('getSlowQueries');
        const slowQueries = await toolGetSlowQueries(
          connection.connectionString,
          connection.username,
          connection.password
        );
        console.log('slowQueries', JSON.stringify(slowQueries));
        return JSON.stringify(slowQueries);
      }
    },
    explainQuery: {
      description: `解释一个SQL语句,返回的是从oceanbase中取得的执行计划.
      返回的结果中partitions(p[0-12])表示使用了13个分区,而表总共13个分区,说明没有用上分区裁剪.
      is_index_back=false,说明没有回表
      is_global_index=false,说明没有全局索引
      给用户输出一个explain的summary,示例如下:
      分析 explain 结果可知， SQL扫描了**个分区，未使用分区键, 未使用全局索引，没有产生回表，建议：
      1. 增加分区键***为过滤条件；
      2. 如***字段不需要，可以从查询条件中移除
      3. **字段使用了全表扫描,建议增加索引
      4. ....
      `,
      parameters: z.object({
        query: z.string()
      }),
      execute: async ({ schema, query }) => {
        if (!schema) {
          schema = 'public';
        }
        const explain = await toolExplainQuery(
          connection.connectionString,
          connection.username,
          connection.password,
          query
        );
        if (explain) {
          return explain;
        } else {
          return 'Could not run EXPLAIN on the query';
        }
      }
    },
    describeTable: {
      description: `Describe a table. If you know the schema, pass it as a parameter. If you don't, use test.`,
      parameters: z.object({
        schema: z.string(),
        tableName: z.string()
      }),
      execute: async ({ schema, tableName }) => {
        if (!schema) {
          schema = 'test';
        }
        console.log('qqq');
        console.log(schema);
        return await toolDescribeTable(
          connection.connectionString,
          connection.username,
          connection.password,
          schema,
          tableName
        );
      }
    },
    findTableSchema: {
      description: `Find the schema of a table. Use this tool to find the schema of a table.`,
      parameters: z.object({
        table: z.string()
      }),
      execute: async ({ table }) => {
        return await toolFindTableSchema(connection.connectionString, connection.username, connection.password, table);
      }
    },
    getTablesAndInstanceInfo: {
      description: `Get the information about tables (sizes, row counts, usage) and the data about server
instance/cluster on which the DB is running. Useful during the initial assessment.`,
      parameters: z.object({}),
      execute: async () => {
        return await getTablesAndInstanceInfo(connection, asUserId);
      }
    },
    getTrxOfHoldLock: {
      description: `查看当前持有锁的事务`,
      parameters: z.object({}),
      execute: async () => {
        console.log('getTrxOfHoldLock start');
        return await getTrxOfHoldLock(connection.connectionString, connection.username, connection.password);
      }
    },
    getSqlOfHoldLockTrx: {
      description: `查看当前持有锁的事务正在执行的Sql语句`,
      parameters: z.object({
        trans_id: z.string()
      }),
      execute: async ({ trans_id }) => {
        console.log('trans_id:' + trans_id);
        return await getSqlOfHoldLockTrx(
          connection.connectionString,
          connection.username,
          connection.password,
          trans_id
        );
      }
    },
    getTrxOfBlock: {
      description: `查看当前被阻塞的事务`,
      parameters: z.object({}),
      execute: async () => {
        return await getTrxOfBlock(connection.connectionString, connection.username, connection.password);
      }
    },
    getSqlOfBlockTrx: {
      description: `查看当前被阻塞的事务正在执行的Sql`,
      parameters: z.object({
        trans_id: z.string()
      }),
      execute: async ({ trans_id }) => {
        return await getSqlOfBlockTrx(connection.connectionString, connection.username, connection.password, trans_id);
      }
    },
    getSqlLockWaitTimeout: {
      description: `查看曾经等待锁超时的Sql`,
      parameters: z.object({}),
      execute: async () => {
        return await getSqlLockWaitTimeout(connection.connectionString, connection.username, connection.password);
      }
    },
    toolQueryRAG: {
      description: `从知识库中检索信息，知识库中包含了 OceanBase（OB）数据库的各种文档，用于补充 LLM 所需的上下文信息。`,
      parameters: z.object({
        query: z.string()
      }),
      execute: async ({ query }) => {
        return await toolQueryRAG(query, 2);
      }
    },
    // getPerformanceAndVacuumSettings: {
    //   description: `Get the performance and vacuum settings for the database.`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await getPerformanceAndVacuumSettings(connection);
    //   }
    // },
    // getPostgresExtensions: {
    //   description: `Get the available and installed PostgreSQL extensions for the database.`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await getPostgresExtensions(connection, asUserId);
    //   }
    // },
    // getInstanceLogs: {
    //   description: `Get the recent logs from the RDS instance. You can specify the period in seconds and optionally grep for a substring.`,
    //   parameters: z.object({
    //     periodInSeconds: z.number(),
    //     grep: z.string().optional()
    //   }),
    //   execute: async ({ periodInSeconds, grep }) => {
    //     console.log('getInstanceLogs', periodInSeconds, grep);
    //     return await getInstanceLogs({ connection, periodInSeconds, grep, asUserId });
    //   }
    // },
    // getInstanceMetric: {
    //   description: `Get the metrics for the RDS instance. You can specify the period in seconds.`,
    //   parameters: z.object({
    //     metricName: z.string(),
    //     periodInSeconds: z.number()
    //   }),
    //   execute: async ({ metricName, periodInSeconds }) => {
    //     console.log('getClusterMetric', metricName, periodInSeconds);
    //     return await getClusterMetric({ connection, metricName, periodInSeconds, asUserId });
    //   }
    // },
    // getCurrentActiveQueries: {
    //   description: `Get the currently active queries.`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await toolCurrentActiveQueries(connection.connectionString);
    //   }
    // },
    // getQueriesWaitingOnLocks: {
    //   description: `Get the queries that are currently blocked waiting on locks.`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await toolGetQueriesWaitingOnLocks(connection.connectionString);
    //   }
    // },
    // getVacuumStats: {
    //   description: `Get the vacuum stats for the top tables in the database. They are sorted by the number of dead tuples descending.`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await toolGetVacuumStats(connection.connectionString);
    //   }
    // },
    // getConnectionsStats: {
    //   description: `Get the connections stats for the database.`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await toolGetConnectionsStats(connection.connectionString);
    //   }
    // },
    // getConnectionsGroups: {
    //   description: `Get the connections groups for the database. This is a view in the pg_stat_activity table, grouped by (state, user, application_name, client_addr, wait_event_type, wait_event).`,
    //   parameters: z.object({}),
    //   execute: async () => {
    //     return await toolGetConnectionsGroups(connection.connectionString);
    //   }
    // },
    getPlaybook: {
      description: `Get a playbook contents by name. A playbook is a list of steps to follow to achieve a goal. Follow it step by step.`,
      parameters: z.object({
        name: z.string()
      }),
      execute: async ({ name }) => {
        return getPlaybook(name);
      }
    },
    listPlaybooks: {
      description: `List the available playbooks.`,
      parameters: z.object({}),
      execute: async () => {
        return listPlaybooks();
      }
    }
  };
}

export function getModelInstance(model: string): LanguageModelV1 {
  const config = {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: ''
  };
  const openai = createOpenAI(config);
  // return openai("qwen-turbo-2025-02-11");
  return openai('qwen-max-latest');
  // if (model.startsWith('openai-')) {
  //   return openai(model.replace('openai-', ''));
  // } else if (model.startsWith('deepseek-')) {
  //   return deepseek(model);
  // } else if (model.startsWith('anthropic-')) {
  //   return anthropic(model.replace('anthropic-', ''));
  // } else {
  //   throw new Error('Invalid model');
  // }
}
