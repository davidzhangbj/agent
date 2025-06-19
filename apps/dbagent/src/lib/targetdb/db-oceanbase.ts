import mysql, { Connection, PoolConnection } from 'mysql2/promise';
export type PoolConfig = mysql.PoolOptions;
export type Pool = mysql.Pool;
export type Client = Connection;
export type ClientBase = PoolConnection;

const DEFAULT_CHARSET = 'utf8mb4'; // 或者 'utf8'，取决于你的数据库配置

export function getTargetDbPool(
  connectionString: string,
  poolConfig: Omit<mysql.PoolOptions, 'connectionString'> = {}
): Pool {
  const parsed = parseConnectionString(connectionString);
  const config = { ...poolConfig, ...parsed, charset: DEFAULT_CHARSET };
  if (!config.connectionLimit) config.connectionLimit = 1;
  return mysql.createPool(config);
}

export async function getTargetDbConnection(
  connectionString: string,
  username: string,
  password: string
): Promise<any> {
  const parsed = parseConnectionString(connectionString);
  parsed.user = username;
  parsed.password = password;
  const client = await mysql.createConnection({ ...parsed, charset: DEFAULT_CHARSET });
  return client;
}

function parseConnectionString(connectionString: string): Record<string, any> {
  const regex = /jdbc:mysql:\/\/([^:\/]+):(\d+)\/([^?]+)/;
  const match = connectionString.match(regex);
  if (match) {
    const host = match[1]; // 第一个捕获组：host
    const port = match[2]; // 第二个捕获组：port
    const database = match[3]; // 第三个捕获组：dbname
    // console.log(username);
    // console.log(password);
    // console.log(host);
    // console.log(Number(port));
    // console.log(database);
    return {
      host: host, // 数据
      port: Number(port), // 数据库主机地址
      database: database // 要连接的数据库名称
    };
  }
  throw new Error('连接串不正确');
}

export async function withPoolConnection<T>(
  pool: Pool | (() => Promise<Pool>),
  fn: (client: ClientBase) => Promise<T>
): Promise<T> {
  const poolInstance = typeof pool === 'function' ? await pool() : pool;
  const client = await poolInstance.getConnection();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withTargetDbConnection<T>(
  connectionString: string,
  username: string,
  password: string,
  fn: (client: ClientBase) => Promise<T>
): Promise<T> {
  const client = await getTargetDbConnection(connectionString, username, password);
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
export interface TableStat {
  name: string;
  schema: string;
  rows: number;
  size: string;
  dataLength: number;
  indexLength: number;
}

export async function getTableStats(client: ClientBase): Promise<TableStat[]> {
  const [rows] = await client.query(`
      SELECT 
        TABLE_SCHEMA as schema,
        TABLE_NAME as name,
        TABLE_ROWS as rows,
        DATA_LENGTH as dataLength,
        INDEX_LENGTH as indexLength,
        CONCAT(ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2), ' MB') as size
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema')
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      LIMIT 100
    `);
  return rows as TableStat[];
}

interface SlowQuery {
  request_time: string;
  elapsed_time: string;
  execute_time: string;
  query_sql: string;
  sql_id: string;
  tenant_id: number;
}

export async function getSlowQueries(client: ClientBase, thresholdMs: number): Promise<SlowQuery[]> {
  // 从oceanbase.GV$OB_SQL_AUDIT视图查找,找总时间超过1秒的
  const [rows] = await client.query(
    `
      select usec_to_time(request_time) as request_time,floor(elapsed_time/1000) as elapsed_time,floor(execute_time/1000) as execute_time,query_sql,sql_id,tenant_id 
      from oceanbase.gv$ob_sql_audit where elapsed_time > ? order by elapsed_time desc limit 10;
    `,
    [thresholdMs]
  );
  console.log(rows);
  return rows as SlowQuery[];
}
interface PlanId {
  sql_id: string;
  plan_id: string;
  outline_data: string;
}
export async function getPlanID(client: ClientBase, sql_id: string): Promise<PlanId[]> {
  // 从oceanbase.GV$OB_PLAN_CACHE_PLAN_STAT视图查找,找计划id
  const [rows] = await client.query(
    `
      SELECT
      sql_id,
      plan_id,
      outline_data
      FROM oceanbase.GV$OB_PLAN_CACHE_PLAN_STAT
      WHERE SQL_ID in (?)
    `,
    [sql_id]
  );
  return rows as PlanId[];
}
interface PhysicalPlan {
  operator: string;
  name: string;
  rows: string;
  cost: number;
}

export async function getPhysicalPlan(client: ClientBase, plan_id: string): Promise<PhysicalPlan[]> {
  // 从oceanbase.GV$OB_PLAN_CACHE_PLAN_EXPLAIN视图查找,找物理执行计划
  const [rows] = await client.query(
    `
    SELECT OPERATOR, NAME, ROWS, COST FROM oceanbase.GV$OB_PLAN_CACHE_PLAN_EXPLAIN
    WHERE TENANT_ID = 1002 AND
    PLAN_ID in (?) ;
    `,
    [plan_id]
  );
  return rows as PhysicalPlan[];
}

export async function explainQuery(client: ClientBase, query: string): Promise<string> {
  const [rows] = await client.query(`EXPLAIN FORMAT=JSON ${query}`);
  console.log('explainQuery');
  const explainQuery = JSON.stringify({ 'Query Plan': (rows as []).map((item) => item['Query Plan']).join('') });
  return explainQuery;
}

export async function describeTable(client: ClientBase, schema: string, tableName: string): Promise<string> {
  const rows = await client.query(`
      show create table ${schema}.${tableName};
      `);
  console.log('describleTable');
  console.log(JSON.stringify(rows[0]));
  return JSON.stringify(rows[0]);
}

export async function findTableSchema(client: ClientBase, table: string): Promise<string> {
  const [rows] = await client.query(
    `select table_schema as 'schema',table_rows from information_schema.TABLES where table_name=? order by table_rows desc limit 1;`,
    [table]
  );
  console.log('findTableSchema rows');
  console.log(rows);
  return (rows as unknown as [{ schema: string; table_rows: number }])[0].schema;
}

export async function getTrxOfHoldLock(client: ClientBase): Promise<string> {
  const [rows] = await client.query(
    `select tenant_id,trans_id as 'transaction_id',session_id from oceanbase.GV$OB_LOCKS where block=0 and type='TR';`
  );
  console.log('getTrxOfHoldLock rows');
  console.log(rows);
  return JSON.stringify(rows);
}

export async function getSqlOfHoldLockTrx(client: ClientBase, tx_id: string): Promise<string> {
  const [rows] = await client.query(
    `select query_sql,tx_id as 'transaction_id' from oceanbase.GV$OB_SQL_AUDIT where tx_id in (?) and seq_num > 1;`,
    [tx_id]
  );
  console.log('getSqlOfHoldLockTrx rows');
  console.log(rows);
  return JSON.stringify(rows);
}

export async function getTrxOfBlock(client: ClientBase): Promise<string> {
  const [rows] = await client.query(
    `select tenant_id,trans_id as 'transaction_id',session_id from oceanbase.GV$OB_LOCKS where block=1 and type='TR'`
  );
  console.log('getTrxOfBlock rows');
  console.log(rows);
  return JSON.stringify(rows);
}

export async function getSqlOfBlockTrx(client: ClientBase, tx_id: string): Promise<string> {
  const [rows] = await client.query(
    `SELECT info as 'query_sql',trans_id as 'transaction_id' FROM oceanbase.GV$OB_PROCESSLIST WHERE STATE = 'ACTIVE' and trans_id in (?)`,
    [tx_id]
  );
  console.log('getSqlOfBlockTrx rows');
  console.log(rows);
  return JSON.stringify(rows);
}

export async function getSqlLockWaitTimeout(client: ClientBase): Promise<string> {
  const [rows] = await client.query(
    `select tenant_id,query_sql,tx_id as 'transaction_id',sid as 'session_id' from oceanbase.GV$OB_SQL_AUDIT where ret_code=-6003;`
  );
  console.log('getSqlLockWaitTimeout rows');
  console.log(rows);
  return JSON.stringify(rows);
}
