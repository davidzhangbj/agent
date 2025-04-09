import { describeTable, explainQuery, getSlowQueries } from '../targetdb/db-oceanbase';

export async function toolGetSlowQueries(connString: string, username: string, password: string): Promise<string> {
  const slowQueries = await getSlowQueries(connString, username, password);
  const result = JSON.stringify(slowQueries);
  console.log(result);
  return JSON.stringify(slowQueries);
}

export async function toolExplainQuery(
  connString: string,
  username: string,
  password: string,
  query: string
): Promise<string> {
  const result = await explainQuery(connString, username, password, query);
  return result;
}

export async function toolDescribeTable(
  connString: string,
  username: string,
  password: string,
  schema: string,
  tableName: string
): Promise<string> {
  const result = await describeTable(connString, username, password, schema, tableName);
  return result;
}

// export async function toolGetPlanId(connString: string, username: string, password: string, sql_id: string): Promise<string> {
//   const result = await getPlanID(connString, schema, query);
//   return result;
// }
