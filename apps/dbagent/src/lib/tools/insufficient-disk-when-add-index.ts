import { ClientBase } from '../targetdb/db-oceanbase';

export async function toolGetTenantIdByTenantName(client: ClientBase, tenant_name: string): Promise<string> {
  const [rows] = await client.query(`select tenant_id from oceanbase.__all_tenant where tenant_name = ?;`, [
    tenant_name
  ]);
  console.log('toolGetTenantIdByTenantName:', rows);
  return JSON.stringify(rows);
}

export async function toolGetDatabaseIdByName(client: ClientBase, database_name: string): Promise<string> {
  const [rows] = await client.query(
    `select database_id from oceanbase.__all_virtual_database where database_name = ?;`,
    [database_name]
  );
  console.log('toolGetDatabaseIdByName:', rows);
  return JSON.stringify(rows);
}

export async function toolGetTableId(
  client: ClientBase,
  table_name: string,
  tenant_id: number,
  database_id: number
): Promise<string> {
  const [rows] = await client.query(
    `select table_id from oceanbase.__all_virtual_table where table_name = ? and tenant_id = ? and database_id=?;`,
    [table_name, tenant_id, database_id]
  );
  console.log('toolGetTableId:', rows);
  return JSON.stringify(rows);
}

export async function toolGetTableSpaceSize(client: ClientBase, tenant_id: number, table_id: number): Promise<string> {
  console.log('GetTableSpaceSize param:', tenant_id, table_id);
  const [rows] = await client.query(
    `select svr_ip, svr_port, sum(original_size) as estimated_data_size from oceanbase.__all_virtual_tablet_sstable_macro_info where tablet_id in (select tablet_id from oceanbase.__all_virtual_tablet_to_table_history where tenant_id = ? and table_id = ?) and (svr_ip, svr_port) in (select svr_ip, svr_port from oceanbase.__all_virtual_ls_meta_table where role = 1) group by svr_ip, svr_port;`,
    [tenant_id, table_id]
  );
  console.log('toolGetTableSpaceSize:', rows);
  return JSON.stringify(rows);
}

export async function toolGetIndexTableId(
  client: ClientBase,
  tenant_id: number,
  table_id: number,
  index_name: string
): Promise<string> {
  console.log('toolGetIndexTableId param:', tenant_id, table_id, index_name);
  const likePattern = `%${index_name}%`;
  console.log('likePattern', likePattern);
  const [rows] = await client.query(
    `select table_id from oceanbase.__all_virtual_table_history where tenant_id = ? and data_table_id = ? and table_name like ?;`,
    [tenant_id, table_id, likePattern]
  );
  console.log('toolGetIndexTableId:', rows);
  return JSON.stringify(rows);
}

export async function toolGetSumOfAllColumnLengthsOfTable(
  client: ClientBase,
  tenant_id: number,
  table_id: number
): Promise<string> {
  const [rows] = await client.query(
    `select table_id, sum(data_length) as data_length from oceanbase.__all_virtual_column_history where tenant_id = ? and table_id = ?;`,
    [tenant_id, table_id]
  );
  console.log('toolGetSumOfAllColumnLengthsOfTable:', rows);
  return JSON.stringify(rows);
}

export async function toolGetDiskSpace(client: ClientBase): Promise<string> {
  const [rows] = await client.query(`select total_size, used_size from oceanbase.__all_virtual_disk_stat;`);
  console.log('toolGetDiskSpace:', rows);
  return JSON.stringify(rows);
}

export async function toolGetDiskSpaceLimitRatio(client: ClientBase): Promise<string> {
  const [rows] = await client.query(
    `SELECT VALUE FROM oceanbase.GV$OB_PARAMETERS WHERE NAME LIKE "data_disk_usage_limit_percentage";`
  );
  console.log('toolGetDiskSpaceLimitRatio:', rows);
  return JSON.stringify(rows);
}
