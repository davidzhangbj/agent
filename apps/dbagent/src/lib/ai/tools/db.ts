import { Tool, tool } from 'ai';
import { z } from 'zod';
import {
  toolGetDatabaseIdByName,
  toolGetDiskSpace,
  toolGetDiskSpaceLimitRatio,
  toolGetIndexTableId,
  toolGetSumOfAllColumnLengthsOfTable,
  toolGetTableId,
  toolGetTableSpaceSize,
  toolGetTenantIdByTenantName
} from '~/lib/tools/insufficientDiskWhenAddIndex';
import {
  toolGetSqlLockWaitTimeout,
  toolGetSqlOfBlockTrx,
  toolGetSqlOfHoldLockTrx,
  toolGetTrxOfBlock,
  toolGetTrxOfHoldLock
} from '~/lib/tools/lock-conflict';
import {
  toolDescribeTable,
  toolExecuteSQL,
  toolExplainQuery,
  toolFindTableSchema,
  toolGetSlowQueries
} from '~/lib/tools/slow-queries';
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
      getSqlLockWaitTimeout: this.getSqlLockWaitTimeout(),
      executeSQL: this.executeSQL(),
      getTenantIdByTenantName: this.getTenantIdByTenantName(),
      getDatabaseIdByName: this.getDatabaseIdByName(),
      getTableId: this.getTableId(),
      getTableSpaceSize: this.getTableSpaceSize(),
      getIndexTableId: this.getIndexTableId(),
      getSumOfAllColumnLengthsOfTable: this.getSumOfAllColumnLengthsOfTable(),
      getDiskSpace: this.getDiskSpace(),
      getDiskSpaceLimitRatio: this.getDiskSpaceLimitRatio()
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
      description: `解释一个SQL语句,返回的是从oceanbase中取得的执行计划.
      返回的结果中partitions(p[0-12])表示使用了13个分区,而表总共13个分区,说明没有用上分区裁剪.
      is_index_back=false,说明没有回表
      is_global_index=false,说明没有全局索引
      给用户输出一个explain的summary,示例如下:
      分析 explain 结果可知， SQL扫描了**个分区，未使用分区键, 未使用全局索引，没有产生回表，建议：
      1. 增加分区键***为过滤条件；
      2. 如***字段不需要，可以从查询条件中移除
      3. **字段使用了全表扫描,建议增加索引
      4. ....`,
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

  executeSQL(): Tool {
    const pool = this.#pool;
    return tool({
      description: `执行SQL，结果返回JSON格式，应当在 code 区域渲染成表格`,
      parameters: z.object({
        sql: z.string()
      }),
      execute: async ({ sql }) => {
        try {
          return await withPoolConnection(pool, async (client) => await toolExecuteSQL(client, sql));
        } catch (error) {
          return `Error execute sql: ${error}`;
        }
      }
    });
  }

  getTenantIdByTenantName(): Tool {
    const pool = this.#pool;
    return tool({
      description: `根据租户名获取租户id`,
      parameters: z.object({
        tenant_name: z.string()
      }),
      execute: async ({ tenant_name }) => {
        try {
          return await withPoolConnection(
            pool,
            async (client) => await toolGetTenantIdByTenantName(client, tenant_name)
          );
        } catch (error) {
          return `Error getTenantIdByTenantName: ${error}`;
        }
      }
    });
  }

  getDatabaseIdByName(): Tool {
    const pool = this.#pool;
    return tool({
      description: `根据database的名称,查询database_id`,
      parameters: z.object({
        database_name: z.string()
      }),
      execute: async ({ database_name }) => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetDatabaseIdByName(client, database_name));
        } catch (error) {
          return `Error getDatabaseIdByName: ${error}`;
        }
      }
    });
  }

  getTableId(): Tool {
    const pool = this.#pool;
    return tool({
      description: `根据表名、租户ID、数据库id查询table_id`,
      parameters: z.object({
        table_name: z.string(),
        tenant_id: z.number(),
        database_id: z.number()
      }),
      execute: async ({ table_name, tenant_id, database_id }) => {
        try {
          return await withPoolConnection(
            pool,
            async (client) => await toolGetTableId(client, table_name, tenant_id, database_id)
          );
        } catch (error) {
          return `Error getTableId: ${error}`;
        }
      }
    });
  }

  getTableSpaceSize(): Tool {
    const pool = this.#pool;
    return tool({
      description: `根据table_id和租户ID获取DDL源表的空间大小`,
      parameters: z.object({
        tenant_id: z.number(),
        table_id: z.number()
      }),
      execute: async ({ tenant_id, table_id }) => {
        try {
          return await withPoolConnection(
            pool,
            async (client) => await toolGetTableSpaceSize(client, tenant_id, table_id)
          );
        } catch (error) {
          return `Error getTableSpaceSize: ${error}`;
        }
      }
    });
  }

  getIndexTableId(): Tool {
    const pool = this.#pool;
    return tool({
      description: `根据租户ID、数据表ID和索引名称查询索引表ID`,
      parameters: z.object({
        tenant_id: z.number(),
        data_table_id: z.number(),
        index_name: z.string()
      }),
      execute: async ({ tenant_id, data_table_id, index_name }) => {
        try {
          return await withPoolConnection(
            pool,
            async (client) => await toolGetIndexTableId(client, tenant_id, data_table_id, index_name)
          );
        } catch (error) {
          return `Error getIndexTableId: ${error}`;
        }
      }
    });
  }

  getSumOfAllColumnLengthsOfTable(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查询表中所有列所占字节大小的和`,
      parameters: z.object({
        tenant_id: z.number(),
        table_id: z.number()
      }),
      execute: async ({ tenant_id, table_id }) => {
        try {
          return await withPoolConnection(
            pool,
            async (client) => await toolGetSumOfAllColumnLengthsOfTable(client, tenant_id, table_id)
          );
        } catch (error) {
          return `Error getSumOfAllColumnLengthsOfTable: ${error}`;
        }
      }
    });
  }

  getDiskSpace(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查询磁盘的总空间和已使用空间`,
      parameters: z.object({}),
      execute: async () => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetDiskSpace(client));
        } catch (error) {
          return `Error getDiskSpace: ${error}`;
        }
      }
    });
  }

  getDiskSpaceLimitRatio(): Tool {
    const pool = this.#pool;
    return tool({
      description: `查询用户可用磁盘空间占总磁盘空间的比例`,
      parameters: z.object({}),
      execute: async () => {
        try {
          return await withPoolConnection(pool, async (client) => await toolGetDiskSpaceLimitRatio(client));
        } catch (error) {
          return `Error getDiskSpaceLimitRatio: ${error}`;
        }
      }
    });
  }
}
