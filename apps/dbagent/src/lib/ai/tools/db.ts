import { Tool, tool } from 'ai';
import { z } from 'zod';
import {
  toolGetSqlLockWaitTimeout,
  toolGetSqlOfBlockTrx,
  toolGetSqlOfHoldLockTrx,
  toolGetTrxOfBlock,
  toolGetTrxOfHoldLock
} from '~/lib/tools/lock-conflict';
import { toolDescribeTable, toolExplainQuery, toolFindTableSchema, toolGetSlowQueries } from '~/lib/tools/slow-queries';
import { ToolsetGroup } from './types';

import { Pool, withPoolConnection } from '~/lib/targetdb/db-oceanbase';

export function getDBSQLTools(targetDb: Pool): DBSQLTools {
  return new DBSQLTools(targetDb);
}

// The DBSQLTools toolset provides tools for querying the postgres database
// directly via SQL to collect system performance information.
export class DBSQLTools implements ToolsetGroup {
  #pool: Pool | (() => Promise<Pool>);

  constructor(pool: Pool | (() => Promise<Pool>)) {
    this.#pool = pool;
  }

  toolset(): Record<string, Tool> {
    return {
      getSlowQueries: this.getSlowQueries(),
      explainQuery: this.explainQuery(),
      describeTable: this.describeTable(),
      findTableSchema: this.findTableSchema(),
      getTrxOfHoldLock: this.getTrxOfHoldLock(),
      getSqlOfHoldLockTrx: this.getSqlOfHoldLockTrx(),
      getTrxOfBlock: this.getTrxOfBlock(),
      getSqlOfBlockTrx: this.getSqlOfBlockTrx(),
      getSqlLockWaitTimeout: this.getSqlLockWaitTimeout()
    };
  }

  getSlowQueries(): Tool {
    const pool = this.#pool;
    return tool({
      description: `Contains request time the query was called,elapsed time in milliseconds, 
      the execution time in milliseconds, and the query sql itself.`,
      parameters: z.object({}),
      execute: async () => {
        try {
          // 单位是微秒,100000是0.1秒
          return await withPoolConnection(pool, async (client) => await toolGetSlowQueries(client, 100000));
        } catch (error) {
          return `Error getting slow queries: ${error}`;
        }
      }
    });
  }

  explainQuery(): Tool {
    const pool = this.#pool;
    return tool({
      description: `解释一个SQL语句,返回的是从oceanbase中取得的执行计划，应当结合 queryRAG 检索的 Explain 解释内容解读。`,
      parameters: z.object({
        query: z.string()
      }),
      execute: async ({ query }) => {
        try {
          const explain = await withPoolConnection(pool, async (client) => await toolExplainQuery(client, query));
          if (!explain) return 'Could not run EXPLAIN on the query';

          return explain;
        } catch (error) {
          return `Error running EXPLAIN on the query: ${error}`;
        }
      }
    });
  }

  describeTable(): Tool {
    const pool = this.#pool;
    return tool({
      description: `Describe a table. If you know the schema, pass it as a parameter. If you don't, use test.`,
      parameters: z.object({
        schema: z.string(),
        table: z.string()
      }),
      execute: async ({ schema = 'test', table }) => {
        try {
          return await withPoolConnection(pool, async (client) => await toolDescribeTable(client, schema, table));
        } catch (error) {
          return `Error describing table: ${error}`;
        }
      }
    });
  }

  findTableSchema(): Tool {
    const pool = this.#pool;
    return tool({
      description: `Find the schema of a table. Use this tool to find the schema of a table.`,
      parameters: z.object({
        table: z.string()
      }),
      execute: async ({ table }) => {
        try {
          return await withPoolConnection(pool, async (client) => await toolFindTableSchema(client, table));
        } catch (error) {
          return `Error finding table schema: ${error}`;
        }
      }
    });
  }

  getTrxOfHoldLock(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查看当前持有锁的事务`,
      parameters: z.object({}),
      execute: async () => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetTrxOfHoldLock(client));
        } catch (error) {
          return `Error get trx of hold lock: ${error}`;
        }
      }
    });
  }

  getSqlOfHoldLockTrx(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查看当前持有锁的事务正在执行的Sql语句`,
      parameters: z.object({
        trans_id: z.string()
      }),
      execute: async ({ trans_id }) => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetSqlOfHoldLockTrx(client, trans_id));
        } catch (error) {
          return `Error get sql of hold lock trx: ${error}`;
        }
      }
    });
  }

  getTrxOfBlock(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查看当前被阻塞的事务`,
      parameters: z.object({}),
      execute: async () => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetTrxOfBlock(client));
        } catch (error) {
          return `Error get trx of block: ${error}`;
        }
      }
    });
  }

  getSqlOfBlockTrx(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查看当前持有锁的事务正在执行的Sql语句`,
      parameters: z.object({
        trans_id: z.string()
      }),
      execute: async ({ trans_id }) => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetSqlOfBlockTrx(client, trans_id));
        } catch (error) {
          return `Error get sql of block trx: ${error}`;
        }
      }
    });
  }

  getSqlLockWaitTimeout(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查看曾经等待锁超时的Sql`,
      parameters: z.object({}),
      execute: async () => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetSqlLockWaitTimeout(client));
        } catch (error) {
          return `Error get sql of lock wait timeout: ${error}`;
        }
      }
    });
  }
}
