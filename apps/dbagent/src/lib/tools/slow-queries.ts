import { ClientBase, describeTable, explainQuery, findTableSchema, getSlowQueries } from '../targetdb/db-oceanbase';

export async function toolGetSlowQueries(client: ClientBase, thresholdMs: number): Promise<string> {
  const slowQueries = await getSlowQueries(client, thresholdMs);
  // Filter out slow queries with query text larger than 5k characters
  const filteredSlowQueries = slowQueries.map((query) => {
    if (query.query_sql && query.query_sql.length > 5000) {
      return {
        ...query,
        query: 'Err: query too long to analyze'
      };
    }
    return query;
  });

  const result = JSON.stringify(filteredSlowQueries);
  console.log(result);

  return JSON.stringify(filteredSlowQueries);
}

export async function toolExplainQuery(client: ClientBase, query: string): Promise<string> {
  const result = await explainQuery(client, query);
  return JSON.stringify(result);
}

export async function toolDescribeTable(client: ClientBase, schema: string, table: string): Promise<string> {
  const result = await describeTable(client, schema, table);
  return JSON.stringify(result);
}

export async function toolFindTableSchema(client: ClientBase, table: string): Promise<string> {
  const result = await findTableSchema(client, table);
  return JSON.stringify(result);
}

export async function toolExecuteSQL(client: ClientBase, sql: string): Promise<string> {
  const [rows] = await client.query(sql);
  return JSON.stringify(rows);
}
