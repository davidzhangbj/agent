import { Connection, createConnection } from 'mysql2/promise';

export async function getTargetDbConnection(
  connectionString: string,
  username: string,
  password: string
): Promise<Connection> {
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

    const connection = await createConnection({
      host: host, // 数据库主机地址
      user: username, // 数据库用户名
      password: password, // 数据库密码
      database: database, // 要连接的数据库名称
      port: Number(port)
    });
    return connection;
  } else {
    console.log('No match found.');
  }
  throw new Error('连接串、用户名或者密码不正确');
}

export interface TableStat {
  name: string;
  schema: string;
  rows: number;
  size: string;
  dataLength: number;
  indexLength: number;
}

export async function getTableStats(connString: string, username: string, password: string): Promise<TableStat[]> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(`
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
  } finally {
    await conn.end();
  }
}

export interface PerformanceSetting {
  name: string;
  setting: string;
  description: string;
}

export async function getPerformanceSettings(
  connString: string,
  username: string,
  password: string
): Promise<PerformanceSetting[]> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(`
      SHOW VARIABLES WHERE Variable_name IN (
        'max_connections',
        'innodb_buffer_pool_size',
        'innodb_buffer_pool_instances',
        'innodb_log_file_size',
        'innodb_flush_log_at_trx_commit',
        'innodb_flush_method',
        'query_cache_size',
        'max_allowed_packet',
        'wait_timeout',
        'interactive_timeout'
      )
    `);
    return (rows as any[]).map((row) => ({
      name: row.Variable_name,
      setting: row.Value,
      description: '' // MySQL doesn't provide built-in descriptions
    }));
  } finally {
    await conn.end();
  }
}

export interface ActiveQuery {
  id: number;
  state: string;
  query: string;
  duration: number;
  info: string;
}

export async function getCurrentActiveQueries(
  connString: string,
  username: string,
  password: string
): Promise<ActiveQuery[]> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(`
      SELECT 
        ID as id,
        STATE as state,
        TIME as duration,
        INFO as query
      FROM information_schema.PROCESSLIST
      WHERE COMMAND != 'Sleep'
        AND ID != CONNECTION_ID()
      ORDER BY TIME DESC
      LIMIT 500
    `);
    return rows as ActiveQuery[];
  } finally {
    await conn.end();
  }
}

export interface ConnectionsStats {
  total_connections: number;
  max_connections: number;
  connections_utilization_pctg: number;
}

export async function getConnectionsStats(
  connString: string,
  username: string,
  password: string
): Promise<ConnectionsStats[]> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.PROCESSLIST) as total_connections,
        (SELECT @@max_connections) as max_connections,
        (SELECT ROUND((COUNT(*) / @@max_connections) * 100, 2) 
         FROM information_schema.PROCESSLIST) as connections_utilization_pctg
    `);
    return rows as ConnectionsStats[];
  } finally {
    await conn.end();
  }
}

interface SlowQuery {
  request_time: string;
  elapsed_time: string;
  execute_time: string;
  query_sql: string;
  sql_id: string;
  tenant_id: number;
}

export async function getSlowQueries(connString: string, username: string, password: string): Promise<SlowQuery[]> {
  // 从oceanbase.GV$OB_SQL_AUDIT视图查找,找总时间超过1秒的
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(`
      select usec_to_time(request_time) as request_time,floor(elapsed_time/1000) as elapsed_time,floor(execute_time/1000) as execute_time,query_sql,sql_id,tenant_id 
      from oceanbase.gv$ob_sql_audit where elapsed_time > 100000 order by elapsed_time desc limit 10;
    `);
    console.log(rows);
    return rows as SlowQuery[];
  } finally {
    await conn.end();
  }
}
interface PlanId {
  sql_id: string;
  plan_id: string;
  outline_data: string;
}
export async function getPlanID(
  connString: string,
  username: string,
  password: string,
  sql_id: string
): Promise<PlanId[]> {
  // 从oceanbase.GV$OB_PLAN_CACHE_PLAN_STAT视图查找,找计划id
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
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
  } finally {
    await conn.end();
  }
}
interface PhysicalPlan {
  operator: string;
  name: string;
  rows: string;
  cost: number;
}

export async function getPhysicalPlan(
  connString: string,
  username: string,
  password: string,
  plan_id: string
): Promise<PhysicalPlan[]> {
  // 从oceanbase.GV$OB_PLAN_CACHE_PLAN_EXPLAIN视图查找,找物理执行计划
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `
    SELECT OPERATOR, NAME, ROWS, COST FROM oceanbase.GV$OB_PLAN_CACHE_PLAN_EXPLAIN
    WHERE TENANT_ID = 1002 AND
    PLAN_ID in (?) ;
    `,
      [plan_id]
    );
    return rows as PhysicalPlan[];
  } finally {
    await conn.end();
  }
}

export async function explainQuery(
  connString: string,
  username: string,
  password: string,
  query: string
): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(`EXPLAIN FORMAT=JSON ${query}`);
    console.log('explainQuery');
    const explainQuery = JSON.stringify({ 'Query Plan': (rows as []).map((item) => item['Query Plan']).join('') });
    return explainQuery;
  } catch (error) {
    return `Error explaining query: ${error}`;
  } finally {
    await conn.end();
  }
}

export async function describeTable(
  connString: string,
  username: string,
  password: string,
  schema: string,
  tableName: string
): Promise<string> {
  console.log('ppp');
  console.log(schema);
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const rows = await conn.query(`
      show create table ${schema}.${tableName};
      `);
    console.log('describleTable');
    console.log(JSON.stringify(rows[0]));
    return JSON.stringify(rows[0]);
  } catch (error) {
    console.log(error);
  } finally {
    await conn.end();
  }
  return '';
}

export async function findTableSchema(
  connString: string,
  username: string,
  password: string,
  table: string
): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `select table_schema as 'schema',table_rows from information_schema.TABLES where table_name=? order by table_rows desc limit 1;`,
      [table]
    );
    console.log('findTableSchema rows');
    console.log(rows);
    return (rows as unknown as [{ schema: string; table_rows: number }])[0].schema;
  } finally {
    await conn.end();
  }
}

export async function getTrxOfHoldLock(connString: string, username: string, password: string): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `select tenant_id,trans_id as 'transaction_id',session_id from oceanbase.GV$OB_LOCKS where block=0 and type='TR';`
    );
    console.log('getTrxOfHoldLock rows');
    console.log(rows);
    return JSON.stringify(rows);
  } finally {
    await conn.end();
  }
}

export async function getSqlOfHoldLockTrx(
  connString: string,
  username: string,
  password: string,
  tx_id: string
): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `select query_sql,tx_id as 'transaction_id' from oceanbase.GV$OB_SQL_AUDIT where tx_id in (?) and seq_num > 1;`,
      [tx_id]
    );
    console.log('getSqlOfHoldLockTrx rows');
    console.log(rows);
    return JSON.stringify(rows);
  } finally {
    await conn.end();
  }
}

export async function getTrxOfBlock(connString: string, username: string, password: string): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `select tenant_id,trans_id as 'transaction_id',session_id from oceanbase.GV$OB_LOCKS where block=1 and type='TR'`
    );
    console.log('getTrxOfBlock rows');
    console.log(rows);
    return JSON.stringify(rows);
  } finally {
    await conn.end();
  }
}

export async function getSqlOfBlockTrx(
  connString: string,
  username: string,
  password: string,
  tx_id: string
): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `SELECT info as 'query_sql',trans_id as 'transaction_id' FROM oceanbase.GV$OB_PROCESSLIST WHERE STATE = 'ACTIVE' and trans_id in (?)`,
      [tx_id]
    );
    console.log('getSqlOfBlockTrx rows');
    console.log(rows);
    return JSON.stringify(rows);
  } finally {
    await conn.end();
  }
}

export async function getSqlLockWaitTimeout(connString: string, username: string, password: string): Promise<string> {
  const conn = await getTargetDbConnection(connString, username, password);
  try {
    const [rows] = await conn.query(
      `select tenant_id,query_sql,tx_id as 'transaction_id',sid as 'session_id' from oceanbase.GV$OB_SQL_AUDIT where ret_code=-6003;`
    );
    console.log('getSqlLockWaitTimeout rows');
    console.log(rows);
    return JSON.stringify(rows);
  } finally {
    await conn.end();
  }
}
