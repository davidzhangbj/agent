import { format } from 'date-fns';
import { config } from 'dotenv';
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { CustomToolInsert, customTools } from '~/lib/db/schema-sqlite';

config({ path: ['.env.local'] });
const db = drizzle(process.env.DATABASE_URL!);
const customToolsList: CustomToolInsert[] = [];
customToolsList.push({
  name: 'getOceanBaseVersionInfo',
  description: '获取 OceanBase 详细版本信息',
  script: "SHOW VARIABLES LIKE '%version_comment%';",
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getClusterNameAndId',
  description: '查询 cluster_name 与 cluster_id',
  script: `
  use oceanbase;
  SELECT * FROM gv$ob_parameters WHERE name IN ('cluster', 'cluster_id');`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getClusterCharsets',
  description: '获取集群支持的字符集',
  script: `SELECT
  collation_name AS collation,
  character_set_name AS charset,
  id,
  is_default
  FROM
  information_schema.collations;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getAllZoneInfo',
  description: '查询所有 zone 信息',
  script: `
  use oceanbase;
  SELECT * FROM dba_ob_zones;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getServerStatusInfo',
  description: '查看服务器状态信息',
  script: `
  use oceanbase;
  SELECT
  /*+READ_CONSISTENCY(WEAK), QUERY_TIMEOUT(100000000)*/
  zone,
  svr_ip,
  with_rootserver,
  start_service_time,
  stop_time,
  status,
  substr(
    build_version,
    1,
    instr(build_version, '-') - 1
  ) build_version
  FROM
    dba_ob_servers
  ORDER BY
  zone,
  svr_ip;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getServerResourceConfig',
  description: '查看服务器资源配置',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  svr_ip,
  svr_port,
  cpu_capacity_max AS cpu_total,
  cpu_assigned_max AS cpu_assigned,
  round(mem_capacity / 1024 / 1024 / 1024) mem_total_gb,
  round(mem_assigned / 1024 / 1024 / 1024) mem_assigned_gb,
  round((cpu_assigned_max / cpu_capacity_max), 2) AS cpu_assigned_percent,
  round((mem_assigned / mem_capacity), 2) AS mem_assigned_percent,
  round(data_disk_capacity / 1024 / 1024 / 1024) data_disk_capacity_gb,
  round(data_disk_in_use / 1024 / 1024 / 1024) data_disk_in_use_gb,
  round(
    (data_disk_capacity - data_disk_in_use) / 1024 / 1024 / 1024
  ) data_disk_free_gb,
  round(log_disk_capacity / 1024 / 1024 / 1024) log_disk_capacity_gb,
  round(log_disk_assigned / 1024 / 1024 / 1024) log_disk_assigned_gb,
  round(log_disk_in_use / 1024 / 1024 / 1024) log_disk_in_use_gb
  FROM
    gv$ob_servers
  ORDER BY
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantDegradationLogStream',
  description: '获取租户的降级日志流',
  script: `
  use oceanbase;
  SELECT
  a.tenant_id,
  ls_id,
  svr_ip,
  svr_port,
  role,
  arbitration_member,
  degraded_list
  FROM
    gv$ob_log_stat a,
    dba_ob_tenants b
  WHERE
    degraded_list <> ''
    AND a.tenant_id = b.tenant_id
    AND tenant_type != 'META'
  ORDER BY
  a.tenant_id,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getClusterArbitrationServiceInfo',
  description: '获取集群的仲裁服务信息询所有 zone 信息',
  script: `
  use oceanbase;
  SELECT
  arbitration_service_key,
  arbitration_service,
  previous_arbitration_service,
  type
  FROM
  dba_ob_arbitration_service;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantMergeProgress',
  description: '获取租户的合并进度',
  script: `
  use oceanbase;
  SELECT
  tenant_id,
  compaction_scn,
  100 * (
    1 - SUM(unfinished_tablet_count) / SUM(total_tablet_count)
  ) progress_pct
  FROM
    gv$ob_compaction_progress
  GROUP BY
    tenant_id,
    compaction_scn
  ORDER BY
    compaction_scn
  LIMIT
    20;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantBasicInfo',
  description: '查看租户基础信息',
  script: `
  use oceanbase;
  SELECT
  tenant_id,
  tenant_name,
  tenant_type,
  primary_zone,
  locality,
  compatibility_mode,
  status,
  0 AS locked,
  in_recyclebin,
  timestampdiff(
    second,
    create_time,
    now()
  ) AS exist_seconds
  FROM
    dba_ob_tenants
  WHERE
  tenant_type IN ('SYS', 'USER');`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getUnitSizeList',
  description: '查询 Unit 规格列表',
  script: `
  use oceanbase;
  SELECT
  unit_config_id,
  name,
  max_cpu,
  min_cpu,
  round(memory_size / 1024 / 1024 / 1024) max_memory_size_gb,
  round(memory_size / 1024 / 1024 / 1024) min_memory_size_gb,
  round(log_disk_size / 1024 / 1024 / 1024) log_disk_size_gb,
  max_iops,
  min_iops,
  iops_weight
  FROM
    dba_ob_unit_configs
  ORDER BY
  unit_config_id;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getResourcePoolList',
  description: '查询资源池列表',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  p.tenant_id,
  u.svr_ip,
  uc.name,
  uc.max_cpu,
  uc.min_cpu,
  round(uc.memory_size / 1024 / 1024 / 1024) AS max_memory_gb,
  round(uc.log_disk_size / 1024 / 1024 / 1024) AS log_disk_size_gb,
  uc.max_iops,
  uc.min_iops
  FROM
    dba_ob_resource_pools p,
    dba_ob_unit_configs uc,
    dba_ob_units u
  WHERE
    p.unit_config_id = uc.unit_config_id
    AND u.resource_pool_id = p.resource_pool_id
  ORDER BY
  p.tenant_id,
  u.svr_ip,
  uc.name;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getUnitList',
  description: '查询 Unit 列表',
  script: `
  use oceanbase;
  SELECT
  tenant_id,
  svr_ip,
  svr_port,
  unit_id,
  status,
  create_time,
  modify_time,
  zone,
  unit_config_id,
  max_cpu,
  min_cpu,
  round(memory_size / 1024 / 1024 / 1024) memory_size_gb,
  round(log_disk_size / 1024 / 1024 / 1024) log_disk_size_gb,
  max_iops,
  min_iops
  FROM
    dba_ob_units
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port,
  unit_id;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getUsedDiskResourcesByTenant',
  description: '查看租户已使用磁盘资源',
  script: `
  use oceanbase;
  SELECT
  t1.unit_id,
  t1.svr_ip,
  t1.svr_port,
  t3.tenant_id,
  t3.tenant_name,
  round(t1.log_disk_size / 1024 / 1024 / 1024) AS log_disk_size_gb,
  round(t1.log_disk_in_use / 1024 / 1024 / 1024) AS log_disk_in_use_gb,
  round(t1.data_disk_in_use / 1024 / 1024 / 1024) AS data_disk_in_use_gb
  FROM
  (
    SELECT
      unit_id,
      svr_ip,
      svr_port,
      SUM(log_disk_size) AS log_disk_size,
      SUM(log_disk_in_use) AS log_disk_in_use,
      SUM(data_disk_in_use) AS data_disk_in_use
    FROM
      gv$ob_units
    GROUP BY
      unit_id,
      svr_ip,
      svr_port
  ) t1
  JOIN dba_ob_units t2 ON t1.unit_id = t2.unit_id
  AND t1.svr_ip = t2.svr_ip
  AND t1.svr_port = t2.svr_port
  JOIN (
    SELECT
      tenant_id,
      tenant_name
    FROM
      dba_ob_tenants
    WHERE
      tenant_type IN ('SYS', 'USER')
  ) t3 ON t2.tenant_id = t3.tenant_id
  ORDER BY
  t3.tenant_id,
  t1.svr_ip,
  t1.svr_port,
  t1.unit_id;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantDataVolume',
  description: '查看租户数据量',
  script: `
  use oceanbase;
  SELECT
  tenant_id,
  svr_ip,
  svr_port,
  round(SUM(data_size) / 1024 / 1024) data_size_mb,
  round(SUM(required_size) / 1024 / 1024) required_size_mb
  FROM
    cdb_ob_tablet_replicas
  WHERE
    tenant_id = 1002
  GROUP BY
    tenant_id,
    svr_ip,
    svr_port
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantTableSizeStats',
  description: '查看租户表大小统计',
  script: `
  use oceanbase;
  SELECT
  /*+ READ_CONSISTENCY(WEAK) QUERY_TIMEOUT(50000000) */
  a.tenant_id,
  a.svr_ip,
  a.svr_port,
  c.object_type,
  round(SUM(data_size) / 1024 / 1024) AS data_size_mb,
  round(SUM(required_size) / 1024 / 1024) AS required_size_mb
  FROM
    cdb_ob_table_locations a
    JOIN (
      SELECT
        tenant_id,
        tablet_id,
        svr_ip,
        svr_port,
        data_size,
        required_size
      FROM
        cdb_ob_tablet_replicas
    ) b ON a.tenant_id = b.tenant_id
    AND a.tenant_id = 1002
    AND a.tablet_id = b.tablet_id
    AND a.svr_ip = b.svr_ip
    AND a.svr_port = b.svr_port
    JOIN cdb_objects c ON a.tenant_id = c.con_id
    AND a.table_id = c.object_id
    AND c.object_type = 'TABLE'
  GROUP BY
    a.tenant_id,
    a.svr_ip,
    a.svr_port,
    c.object_type
  ORDER BY
    a.tenant_id,
    a.svr_ip,
    a.svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantPartitionLeaderDistribution',
  description: '租户 partition/leader 分布情况',
  script: `
  use oceanbase;
  SELECT
  zone,
  tenant_id
  svr_ip,
  role,
  COUNT(1) cnt
  FROM
    cdb_ob_table_locations
  GROUP BY
    tenant_id,
    svr_ip,
    role
  ORDER BY
  1,
  4 DESC;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getDatabaseListInMysqlSchema',
  description: 'MySQL 模式查询数据库列表',
  script: `
  use oceanbase;
  SELECT
  o.created AS gmt_create,
  o.object_id AS database_id,
  d.database_name,
  c.id AS collation_type,
  c.character_set_name,
  c.collation_name,
  NULL AS primary_zone,
  0 AS read_only
  FROM
  dba_ob_databases d
  JOIN dba_objects o ON o.object_type = 'DATABASE'
  JOIN information_schema.collations c ON d.database_name = o.object_name
  AND d.collation = c.collation_name;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getObjectList',
  description: '对象列表',
  script: `
  use oceanbase;
  SELECT
  object_type,
  object_name,
  owner AS schema_name
  FROM
    dba_objects
  WHERE
  object_type IN ('TABLE', 'VIEW', 'PROCEDURE')
  AND owner NOT IN ('SYS', 'oceanbase');`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getUserListAndGlobalPermissionsInMysqlSchema',
  description: 'MySQL 模式用户列表及全局权限授权情况',
  script: `
  SELECT
  user,
  account_locked,
  select_priv,
  insert_priv,
  update_priv,
  delete_priv,
  create_priv,
  drop_priv,
  process_priv,
  grant_priv,
  index_priv,
  alter_priv,
  show_db_priv,
  super_priv,
  create_view_priv,
  show_view_priv,
  create_user_priv,
  password
  FROM
  mysql.user;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getDatabasePermissionsInMysqlSchema',
  description: 'MySQL 模式数据库权限授权情况',
  script: `
  use oceanbase;
  SELECT
  db,
  user,
  select_priv,
  insert_priv,
  update_priv,
  delete_priv,
  create_priv,
  drop_priv,
  index_priv,
  alter_priv,
  create_view_priv,
  show_view_priv
  FROM
  mysql.db;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getRolePermissionsInOracleSchema',
  description: 'Oracle 模式角色授权情况',
  script: `
  use oceanbase;
  SELECT
  *
  FROM
    dba_role_privs
  WHERE
    grantee = 'SYS'
  ORDER BY
  grantee,
  granted_role;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getRoleListInOracleSchema',
  description: 'Oracle 模式角色列表',
  script: `
  use oceanbase;
  SELECT
  *
  FROM
    dba_roles
  ORDER BY
  role;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSystemPrivilegeGrantStatusInOracleSchema',
  description: 'Oracle 模式系统权限授权情况',
  script: `
  use oceanbase;
  SELECT
  *
  FROM
    dba_sys_privs
  WHERE
    grantee = 'SYS'
  ORDER BY
  grantee,
  privilege;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getObjectPrivilegeGrantStatusInOracleSchema',
  description: 'Oracle 模式对象权限授权情况',
  script: `
  use oceanbase;
  SELECT
  p.grantee,
  p.owner,
  o.object_type,
  o.object_name,
  p.privilege
  FROM
    dba_tab_privs p
    JOIN dba_objects o ON p.owner = o.owner
    AND p.table_name = o.object_name
  WHERE
    p.grantee = 'SYS'
  ORDER BY
  p.grantee,
  p.owner,
  o.object_type,
  o.object_name,
  p.privilege;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getLogBackupStatus',
  description: '日志备份状态查询',
  script: `
  use oceanbase;
  SELECT
  *
  FROM
  (
    SELECT
      incarnation,
      round_id AS log_archive_round,
      tenant_id,
      path AS backup_dest,
      if(start_scn_display != '', start_scn_display, NULL) AS min_first_time,
      if(
        checkpoint_scn_display != '',
        checkpoint_scn_display,
        NULL
      ) AS max_next_time,
      status,
      if(
        checkpoint_scn != '',
        truncate(
          (time_to_usec(now()) - checkpoint_scn / 1000) / 1000000,
          4
        ),
        NULL
      ) AS delay,
      now(6) AS check_time
    FROM
      cdb_ob_archivelog_summary
      right JOIN (
        SELECT
          tenant_id AS _tenant_id,
          MAX(round_id) AS _round_id
        FROM
          cdb_ob_archivelog_summary
        GROUP BY
          _tenant_id
      ) AS t ON tenant_id = t._tenant_id
      AND round_id = t._round_id
  )
  limit
    0, 100;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getFullBackupStatus',
  description: '全量备份状态查询',
  script: `
  use oceanbase;
  SELECT
  *
FROM
  (
    SELECT
      job_id,
      incarnation,
      tenant_id,
      backup_set_id,
      backup_type,
      path AS backup_dest,
      start_timestamp AS start_time,
      end_timestamp AS end_time,
      now(6) AS check_time,
      status,
      comment,
      description,
      'TENANT' AS backup_level
    FROM
      (
        SELECT
          job_id,
          incarnation,
          tenant_id,
          backup_set_id,
          backup_type,
          path,
          start_timestamp,
          NULL AS end_timestamp,
          status,
          comment,
          description
        FROM
          cdb_ob_backup_jobs
        UNION
        SELECT
          job_id,
          incarnation,
          tenant_id,
          backup_set_id,
          backup_type,
          path,
          start_timestamp,
          end_timestamp,
          status,
          comment,
          description
        FROM
          cdb_ob_backup_job_history
      )
    WHERE
      tenant_id != 1
    ORDER BY
      start_time DESC
  );`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getAllTenantsMergeStatus',
  description: '查询所有租户的合并状态',
  script: `
  use oceanbase;
  SELECT
  tenant_id,
  global_broadcast_scn AS broadcast_scn,
  is_error AS error,
  status,
  frozen_scn,
  last_scn,
  is_suspended AS suspend,
  info,
  start_time,
  last_finish_time,
  timestampdiff(second, start_time, last_finish_time) merge_time_second
FROM
  cdb_ob_major_compaction
ORDER BY
  start_time DESC
LIMIT
  50;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getAllTenantsTabletDumpHistoryInfo',
  description: '查询所有租户的 tablet 转储历史信息',
  script: `
  use oceanbase;
  SELECT
  *
FROM
  gv$ob_tablet_compaction_history
WHERE
  type = 'MINI_MERGE'
  AND finish_time >= date_sub(now(), INTERVAL 2 HOUR)
ORDER BY
  start_time DESC
LIMIT
  50;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMemstoreInfo',
  description: 'memstore 信息',
  script: `
  use oceanbase;
  SELECT
  /*+ MONITOR_AGENT READ_CONSISTENCY(WEAK) */
  tenant_id,
  svr_ip,
  svr_port,
  round(active_span / 1024 / 1024) active_mb,
  round(memstore_used / 1024 / 1024) memstore_used_mb,
  round(freeze_trigger / 1024 / 1024) freeze_trigger_mb,
  round(memstore_limit / 1024 / 1024) mem_limit_mb,
  freeze_cnt,
  round(memstore_used / memstore_limit, 2) mem_usage
  FROM
    gv$ob_memstore
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getDumpInfo',
  description: '查看转储信息',
  script: `
  use oceanbase;
  SELECT
  *
  FROM
    dba_ob_rootservice_event_history
  WHERE
    event = 'root_minor_freeze'
  ORDER BY
    timestamp DESC
  LIMIT
    30;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getDailyMergeTime',
  description: '查看每日合并耗时',
  script: `
  use oceanbase;
  SELECT
  t.tenant_id,
  t.global_boradcast_scn,
  t.merge_begin_time,
  u.merge_end_time,
  timestampdiff(second, t.merge_begin_time, u.merge_end_time) merge_time_second
FROM
  (
    SELECT
      value1 tenant_id,
      value2 global_boradcast_scn,
      timestamp merge_begin_time
    FROM
      dba_ob_rootservice_event_history
    WHERE
      module = 'daily_merge'
      AND event = 'merging'
  ) t,
  (
    SELECT
      value1 tenant_id,
      value2 global_boradcast_scn,
      timestamp merge_end_time
    FROM
      dba_ob_rootservice_event_history
    WHERE
      module = 'daily_merge'
      AND event = 'global_merged'
  ) u
  WHERE
    t.tenant_id = u.tenant_id
    AND t.global_boradcast_scn = u.global_boradcast_scn
  ORDER BY
    3 DESC
  LIMIT
    10;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getCacheSizeStats',
  description: '统计 cache_size',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  tenant_id,
  cache_name,
  round(cache_size / 1024 / 1024) cache_size_mb
  FROM
    gv$ob_kvcache
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port,
  cache_name;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getConnectionStatus',
  description: '查看连接情况',
  script: `
  use oceanbase;
  SELECT
  t2.svr_ip,
  t2.svr_port,
  t1.tenant_name,
  coalesce(t2.active_cnt, 0) AS active_cnt,
  coalesce(t2.all_cnt, 0) AS all_cnt
FROM
  (
    SELECT
      tenant_name
    FROM
      dba_ob_tenants
    WHERE
      tenant_type <> 'META'
  ) t1
  LEFT JOIN (
    SELECT
      count(
        state = 'ACTIVE'
        OR NULL
      ) AS active_cnt,
      COUNT(1) AS all_cnt,
      tenant AS tenant_name,
      svr_ip,
      svr_port
    FROM
      gv$ob_processlist
    GROUP BY
      tenant,
      svr_ip,
      svr_port
  ) t2 ON t1.tenant_name = t2.tenant_name
ORDER BY
  all_cnt DESC,
  active_cnt DESC,
  t2.svr_ip,
  t2.svr_port,
  t1.tenant_name;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getLogStreamSyncDelay',
  description: '日志流同步延迟',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  leader.tenant_id,
  '0' AS replica_type,
  abs(
    MAX(
      CAST(leader_ts AS signed) - CAST(follower_ts AS signed)
    )
  ) / 1000000000 max_clog_sync_delay_seconds
FROM
  (
    SELECT
      MAX(end_scn) leader_ts,
      tenant_id,
      role
    FROM
      gv$ob_log_stat
    WHERE
      role = 'LEADER'
    GROUP BY
      tenant_id
  ) leader
  INNER JOIN (
    SELECT
      MIN(end_scn) follower_ts,
      tenant_id,
      role
    FROM
      gv$ob_log_stat
    WHERE
      role = 'FOLLOWER'
    GROUP BY
      tenant_id
  ) follower ON leader.tenant_id = follower.tenant_id
GROUP BY
  leader.tenant_id
ORDER BY
  leader.tenant_id;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getIndexOfErrorCount',
  description: '查询索引错误数',
  script: `
  use oceanbase;
  SELECT
  /*+ MONITOR_AGENT QUERY_TIMEOUT(100000000) */
  COUNT(*) AS cnt
  FROM
    cdb_indexes
  WHERE
  status IN ('ERROR', 'UNUSABLE');`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getIndexOfStatus',
  description: '查询索引状态',
  script: `
  use oceanbase;
  SELECT
  con_id tenant_id,
  table_type,
  table_owner,
  table_name,
  owner index_owner,
  index_name,
  status,
  index_type,
  uniqueness,
  compression
  FROM
    cdb_indexes
  WHERE
    con_id = 1012
    AND table_owner = 'ALVIN'
  --   AND table_name = 'TEST'
  ORDER BY
  tenant_id,
  table_owner,
  table_name,
  index_name;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getIndexOfException',
  description: '查询异常的索引',
  script: `
  use oceanbase;
  SELECT
  con_id tenant_id,
  table_type,
  table_owner,
  table_name,
  owner index_owner,
  index_name,
  status,
  index_type,
  uniqueness,
  compression
  FROM
    cdb_indexes
  WHERE
  status IN ('ERROR', 'UNUSABLE');`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getPlanCacheStats',
  description: 'plan cache 统计',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  tenant_id,
  mem_used,
  access_count,
  hit_count
  FROM
  v$ob_plan_cache_stat;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMemtableSnapshotTime',
  description: 'memtable 快照时间',
  script: `
  use oceanbase;
  SELECT
  /*+ PARALLEL(2), ENABLE_PARALLEL_DML, MONITOR_AGENT */
  tenant_id,
  svr_ip,
  svr_port,
  MAX(unix_timestamp(now()) - end_log_scn / 1000000000) max_snapshot_duration_seconds
  FROM
    gv$ob_sstables
  WHERE
    table_type = 'MEMTABLE'
    AND is_active = 'NO'
    AND end_log_scn / 1000000000 > 1
  GROUP BY
    tenant_id,
    svr_ip,
    svr_port
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMemoryUsageStatsByTenant',
  description: '按租户统计使用的内存',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  tenant_id,
  svr_ip,
  svr_port,
  round(SUM(hold) / 1024 / 1024) AS hold_mb,
  round(SUM(used) / 1024 / 1024) AS used_mb
  FROM
    gv$ob_memory
  WHERE
    mod_name <> 'KvstorCacheMb'
  GROUP BY
    tenant_id,
    svr_ip,
    svr_port
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMemoryUsageStatsByModule',
  description: '按模块统计使用的内存',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  tenant_id,
  svr_ip,
  svr_port,
  mod_name,
  round(SUM(hold) / 1024 / 1024) AS hold_mb,
  round(SUM(used) / 1024 / 1024) AS used_mb
  FROM
    gv$ob_memory
  WHERE
    mod_name <> 'KvstorCacheMb'
  GROUP BY
    tenant_id,
    svr_ip,
    svr_port,
    mod_name
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port,
  mod_name;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getLatchInfo',
  description: 'latch 信息',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  con_id tenant_id,
  name,
  svr_ip,
  svr_port,
  gets,
  misses,
  sleeps,
  immediate_gets,
  immediate_misses,
  spin_gets,
  wait_time / 1000000 AS wait_time
  FROM
    gv$latch
  WHERE
    (
      con_id = 1
      OR con_id > 1000
    )
    AND (
      gets > 0
      OR misses > 0
      OR sleeps > 0
      OR immediate_gets > 0
      OR immediate_misses > 0
    )
  ORDER BY
  tenant_id,
  name,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getExecutionTimeOfSystemTasks',
  description: '正在执行的系统任务执行时间',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  tenant_id,
  job_type AS task_type,
  timestampdiff(second, start_time, current_timestamp) AS max_sys_task_duration_seconds,
  rs_svr_ip AS svr_ip,
  rs_svr_port AS svr_port
  FROM
    dba_ob_tenant_jobs
  WHERE
    job_status = 'INPROGRESS'
  UNION
  SELECT
    tenant_id,
    job_type AS task_type,
    timestampdiff(second, start_time, current_timestamp) AS max_sys_task_duration_seconds,
    rs_svr_ip AS svr_ip,
    rs_svr_port AS svr_port
  FROM
    dba_ob_unit_jobs
  WHERE
    tenant_id IS NOT NULL
    AND job_status = 'INPROGRESS'
  ORDER BY
  tenant_id,
  task_type,
  svr_ip,
  svr_port;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getAllSystemTasks',
  description: '查询所有系统任务',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  tenant_id,
  rs_svr_ip AS svr_ip,
  rs_svr_port svr_port,
  job_status,
  job_type AS task_type,
  timestampdiff(second, start_time, current_timestamp) AS max_sys_task_duration_seconds
  FROM
    dba_ob_tenant_jobs
  UNION
  SELECT
    tenant_id,
    rs_svr_ip AS svr_ip,
    rs_svr_port svr_port,
    job_status,
    job_type AS task_type,
    timestampdiff(second, start_time, current_timestamp) AS max_sys_task_duration_seconds
  FROM
    dba_ob_unit_jobs
  WHERE
    tenant_id IS NOT NULL
  ORDER BY
  tenant_id,
  svr_ip,
  svr_port,
  job_status,
  task_type;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getExecutionTimeOfServerTasks',
  description: '正在执行的server任务执行时间',
  script: `
  use oceanbase;
  SELECT
  job_type AS task_type,
  timestampdiff(second, start_time, current_timestamp) AS max_sys_task_duration_seconds,
  svr_ip
  FROM
    dba_ob_server_jobs
  WHERE
    job_status = 'INPROGRESS'
  ORDER BY
  start_time DESC,
  task_type,
  job_status;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getAllServerTasks',
  description: '查询所有server任务',
  script: `
  use oceanbase;
  SELECT
  job_type AS task_type,
  job_status,
  timestampdiff(second, start_time, current_timestamp) AS max_sys_task_duration_seconds,
  svr_ip
  FROM
    dba_ob_server_jobs
  ORDER BY
  start_time DESC,
  task_type,
  job_status;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSystemEventsByTenantStatistics',
  description: '系统事件按租户分类统计',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  con_id tenant_id,
  SUM(total_waits) AS total_waits,
  SUM(time_waited_micro) / 1000000 AS time_waited
  FROM
    v$system_event
  WHERE
    v$system_event.wait_class <> 'IDLE'
    AND (
      con_id > 1000
      OR con_id = 1
    )
  GROUP BY
  tenant_id;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSystemEventsByEventStatistics',
  description: '系统事件按 event 分类统计',
  script: `
  use oceanbase;
  SELECT
  /* MONITOR_AGENT */
  con_id tenant_id,
  CASE
  WHEN event_id = 10000 THEN 'INTERNAL'
  WHEN event_id = 13000 THEN 'SYNC_RPC'
  WHEN event_id = 14003 THEN 'ROW_LOCK_WAIT'
  WHEN (
    event_id >= 10001
    AND event_id <= 11006
  )
  OR (
    event_id >= 11008
    AND event_id <= 11011
  ) THEN 'IO'
  WHEN event LIKE 'latch:%' THEN 'LATCH'
  ELSE 'OTHER'
  END
    event_group,
    SUM(total_waits) AS total_waits,
    SUM(time_waited_micro / 1000000) AS time_waited
  FROM
    v$system_event
  WHERE
    v$system_event.wait_class <> 'IDLE'
    AND (
      con_id > 1000
      OR con_id = 1
    )
  GROUP BY
    tenant_id,
    event_group
  ORDER BY
    tenant_id,
    event_group;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSystemStatisticsInfo',
  description: '系统统计信息',
  script: `
  use oceanbase;
  SELECT /* MONITOR_AGENT */
    con_id tenant_id,
    stat_id,
    value
  FROM
      v$sysstat
  WHERE
      stat_id IN ( 10000, 10001, 10002, 10003, 10004,
                  10005, 10006, 140002, 140003, 140005,
                  140006, 140012, 140013, 40030, 80040,
                  80041, 130000, 130001, 130002, 130004,
                  20000, 20001, 20002, 30000, 30001,
                  30002, 30005, 30006, 30007, 30008,
                  30009, 30010, 30011, 30012, 30013,
                  30080, 30081, 30082, 30083, 30084,
                  30085, 30086, 40000, 40001, 40002,
                  40003, 40004, 40005, 40006, 40007,
                  40008, 40009, 40010, 40011, 40012,
                  40018, 40019, 40116, 40117, 40118,
                  50000, 50001, 60087, 50004, 50005,
                  50008, 50009, 50010, 50011, 50037,
                  50038, 60000, 60001, 60002, 60003,
                  60004, 60005, 60019, 60020, 60021,
                  60022, 60023, 60024, 80001, 80002,
                  80003, 80007, 80008, 80009, 80057,
                  120000, 120001, 120009, 120008 )
    AND ( con_id > 1000
          OR con_id = 1 )
    AND class < 1000;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSystemStatisticsInfoWithoutMetaTenant',
  description: '不含 META 租户的：',
  script: `
  use oceanbase;
  SELECT /* MONITOR_AGENT */
    tenant_id,
    stat_id,
    value
FROM
    v$sysstat,
    dba_ob_tenants
WHERE
    stat_id IN ( 30066, 50003, 50021, 50022, 50030,
                 50039, 50040, 60031, 60057, 60083,
                 80023, 80025, 80026, 120002, 120005,
                 120006, 200001, 200002 )
    AND ( con_id > 1000
          OR con_id = 1 )
    AND dba_ob_tenants.tenant_id = v$sysstat.con_id
    AND dba_ob_tenants.tenant_type <> 'META'
UNION ALL
SELECT
    con_id AS tenant_id,
    stat_id,
    value
FROM
    v$sysstat
WHERE
    stat_id IN ( 80025, 80026, 80023 )
    AND con_id > 1
    AND con_id < 1001
    AND value > 0;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSqlForTopTenInLastTenMinutesSortedByElapsedTime',
  description: '获取 elapsed_time 排序最近10分钟内的 top 10 的 SQL',
  script: `
  use oceanbase;
  SELECT
  /*+READ_CONSISTENCY(WEAK), QUERY_TIMEOUT(100000000)*/
  tenant_id,
  tenant_name,
  user_name,
  db_name,
  svr_ip,
  plan_id,
  plan_type,
  affected_rows,
  return_rows,
  elapsed_time,
  execute_time,
  sql_id,
  usec_to_time(request_time),
  substr(
    replace(query_sql, '\n', ' '),
    1,
    100
  )
  FROM
    gv$ob_sql_audit
  WHERE
    1 = 1
    AND request_time > (time_to_usec(now()) - 10 * 60 * 1000000)
    AND is_inner_sql = 0 -- and tenant_id = 1001
  ORDER BY
    elapsed_time DESC
  LIMIT
    10;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getSqlForTopTenBusinessTenantsByQpsInLastTenMinutes',
  description: '按 qps 排序获取业务租户最近10分钟执行次数最多的 top 10的 SQL',
  script: `
  use oceanbase;
  SELECT
  /*+READ_CONSISTENCY(WEAK), QUERY_TIMEOUT(100000000)*/
  tenant_id,
  sql_id,
  COUNT(1) / 60 qps,
  AVG(elapsed_time),
  AVG(execute_time),
  AVG(queue_time),
  AVG(return_rows),
  AVG(affected_rows),
  substr(
    replace(query_sql, '\n', ' '),
    1,
    100
  ) query_sql,
  ret_code
  FROM
    gv$ob_sql_audit
  WHERE
    1 = 1
    AND request_time > (time_to_usec(now()) - 10 * 60 * 1000000)
    AND is_inner_sql = 0
    AND tenant_id > 1000
  GROUP BY
    tenant_id,
    sql_id,
    query_sql,
    ret_code
  ORDER BY
    qps DESC
  LIMIT
    10;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getLogStreamLeadersForTenant',
  description: '查看租户的各个日志流leader在哪里',
  script: `
  use oceanbase;
  SELECT a.svr_ip, a.svr_port, a.tenant_id, a.ls_id, b.end_scn
	, a.unsubmitted_log_scn, a.pending_cnt
  FROM __all_virtual_replay_stat a
    JOIN __all_virtual_log_stat b
    ON a.svr_ip = b.svr_ip
      AND a.svr_port = b.svr_port
      AND a.tenant_id = b.tenant_id
      AND a.ls_id = b.ls_id
      AND a.role = 'LEADER'
  ORDER BY 1, 2, 3, 4;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTablesWithoutLeader',
  description: '检查无leader的表',
  script: `
  use oceanbase;
  SELECT /*+ READ_CONSISTENCY(WEAK),QUERY_TIMEOUT(100000000) */ TENANT_ID, LS_ID
  FROM GV $OB_LOG_STAT
  GROUP BY TENANT_ID, LS_ID
  EXCEPT
  SELECT TENANT_ID, LS_ID
  FROM GV $OB_LOG_STAT
  WHERE ROLE = 'LEADER';`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMergeStatusForEachZoneAndTenantInCluster',
  description: '查询集群中每个zone每个租户当前的合并状态',
  script: `
  use oceanbase;
  select * from CDB_OB_ZONE_MAJOR_COMPACTION;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMergeChecksumErrorsInCluster',
  description: '查询集群中合并是否有checksum相关的错误',
  script: `
  use oceanbase;
  select * from CDB_OB_COLUMN_CHECKSUM_ERROR_INFO;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getMacroBlockUtilizationForTable',
  description: '查询某个表的宏块利用率',
  script: `
  use oceanbase;
  SELECT 
    loc.TENANT_ID,
    loc.DATABASE_NAME,
    loc.TABLE_NAME,
    loc.TABLE_ID,
    SUM(rep.DATA_SIZE) AS DATA_SIZE,
    SUM(rep.REQUIRED_SIZE) AS REQUIRED_SIZE,
    SUM(rep.DATA_SIZE) / NULLIF(SUM(rep.REQUIRED_SIZE), 0) AS SIZE_RATIO
  FROM 
      oceanbase.CDB_OB_TABLE_LOCATIONS loc
  JOIN 
      oceanbase.CDB_OB_TABLET_REPLICAS rep
  ON 
      loc.TABLET_ID = rep.TABLET_ID
  WHERE 
      loc.TABLE_TYPE = 'USER TABLE' and     loc.TENANT_ID = 1002
  GROUP BY 
    loc.DATABASE_NAME,
    loc.TABLE_NAME,
    loc.TABLE_ID;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
customToolsList.push({
  name: 'getTenantLevelDumpHistoryForOneDay',
  description: '租户级别的1天内的转储历史',
  script: `
  use oceanbase;
  SELECT
  tenant_id,
  MIN(start_time) AS min_start_time,
  MAX(finish_time) AS max_finish_time,
  SUM(occupy_size) AS occupy_size,
  SUM(total_row_count) AS total_row_count,
  COUNT(1) AS tablet_count
FROM
  gv$ob_tablet_compaction_history
WHERE
  type = 'MINI_MERGE'
--   AND finish_time >= date_sub(now(), INTERVAL 600 SECOND)
--   AND finish_time >= date_sub(now(), INTERVAL 3 HOUR)
  AND finish_time >= date_sub(now(), INTERVAL 1 DAY)
GROUP BY
  tenant_id
LIMIT
  50;`,
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
});
console.log('要插入数据库的custom sql tool数量:', customToolsList.length);
await db.insert(customTools).values(customToolsList);
const result = await db.select({ count: count() }).from(customTools);
console.log('customTools表大小:', result[0]?.count);
