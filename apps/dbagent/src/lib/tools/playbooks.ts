export interface Playbook {
  name: string;
  description: string;
  content: string;
  isBuiltIn: boolean;
}

const OCEANBASE_SLOW_QUERIES_PLAYBOOK = `
遵循下面的步骤去发现和解决oceanbase的慢查询:
步骤一:
使用工具getSlowQueries去查找慢查询
步骤二:
挑选一个查询去调查,不需要必须是最慢的查询.
最好是select查询,避免update,delete,insert.
避免内省查询,比如oceanbase库的,这很重要.
在你的总结中要包含查询语句,但是要把它变成多行,这样每行就不会超过80个字符
步骤三:
使用工具findTableSchema去发现你挑选的慢查询所关联表的Schema.
使用工具describeTable去描述你发现的表
步骤四:
使用工具explainQuery去解释慢查询,把你找到的schema传递给工具；
注意 “Outputs & filters” 部分的输出：
1. [!必须]输出 partitions 的数量，并与表结构的分区信息进行对比，是否扫描了所有分区导致效率下降；
2. 输出 is_index_back 字段是否为 true，回表导致性能下降；
3. 关注 is_index_range 字段是否为 true，范围扫描导致性能下降；
最后:
在你完成之后,对你的发现做一个总结,并给用户一个建议SQL语句的示例.
`;
const OCEANBASE_INVESTIGATE_LOCK_CONFLICT = `
遵循下面的步骤去发现oceanbase中是否发生过锁冲突:
步骤一:
使用工具getTrxOfHoldLock查看持有锁的事务ID
步骤二:
使用工具getSqlOfHoldLockTrx查看持有锁的事务正在执行的Sql语句
步骤三:
使用工具getTrxOfBlock查看被阻塞的事务ID
步骤四:
使用工具getSqlOfBlockTrx查看被阻塞事务正在执行的Sql
步骤五:
使用工具getSqlLockWaitTimeout查看曾经等待锁超时的Sql
最后:
在你完成之后,对你的发现做一个分析:所有这些Sql语句之间有没有可能出现锁冲突的问题,如果有可能,将发生锁冲突的Sql语句、
tenant id、transaction id和session id列出来
`;
const OCEANBASE_INSUFFICIENT_DISK_SPACE_WHEN_ADDING_AN_INDEX = `
在创建索引失败时报磁盘不足问题时,遵循下面的步骤对该问题进行调查:
步骤一:
使用工具getTenantIdByTenantName查询租户id
步骤二:
使用工具getDatabaseIdByName查询数据库id
步骤三:
根据表名、租户id、数据库id,使用工具getTableId查询数据表的table id
步骤四:
根据租户id、数据表table_id、索引名称,使用工具getIndexTableId查询索引表的table id
步骤五:
根据租户id、数据表的table id,使用工具getSumOfAllColumnLengthsOfTable查询数据表中所有列所占字节大小的和
步骤六:
根据租户id、索引表的table id,使用工具getSumOfAllColumnLengthsOfTable查询索引表中所有列所占字节大小的和
步骤七:
使用工具getDiskSpace查询磁盘的总空间和已使用的空间
步骤八:
使用工具getDiskSpaceLimitRatio查询用户可用磁盘空间占总磁盘空间的比例限制
步骤九:
根据数据表的table id、租户id查询数据表占用的磁盘空间
步骤十:
计算索引预计占用的空间大小,计算公式:索引表中所有列所占字节大小的和/数据表中所有列所占字节大小的和*数据表占用的磁盘空间*1.5
步骤十一:
计算可用磁盘空间,计算公式:磁盘的总空间*用户可用磁盘空间占总磁盘空间的比例限制-已使用的空间
最后:
如果索引预计占用的空间大小小于可用磁盘空间,则反馈磁盘空间是足够的,反之反馈磁盘空间不足,并把所有查询和计算出的数据反馈给用户
`;

export function getPlaybook(name: string): string {
  switch (name) {
    case 'oceanbaseSlowQuery':
      return OCEANBASE_SLOW_QUERIES_PLAYBOOK;
    case 'oceanbaseLockConflict':
      return OCEANBASE_INVESTIGATE_LOCK_CONFLICT;
    case 'oceanbaseInsufficientDiskSpace':
      return OCEANBASE_INSUFFICIENT_DISK_SPACE_WHEN_ADDING_AN_INDEX;
    default:
      return `Error:Playbook ${name} not found`;
  }
}

export function listPlaybooks(): string[] {
  //TODO: add the custom playbooks
  return ['oceanbaseSlowQuery', 'oceanbaseLockConflict', 'oceanbaseInsufficientDiskSpace'];
}

export function getBuiltInPlaybooks(): Playbook[] {
  return [
    {
      name: 'oceanbaseSlowQuery',
      description: '查询OceanBase的慢查询，并分析原因',
      content: OCEANBASE_SLOW_QUERIES_PLAYBOOK,
      isBuiltIn: true
    },
    {
      name: 'oceanbaseLockConflict',
      description: '分析OceanBase是否存在锁冲突',
      content: OCEANBASE_INVESTIGATE_LOCK_CONFLICT,
      isBuiltIn: true
    },
    {
      name: 'oceanbaseInsufficientDiskSpace',
      description: '创建索引失败报磁盘不足问题时，对该问题进行调查',
      content: OCEANBASE_INVESTIGATE_LOCK_CONFLICT,
      isBuiltIn: true
    }
  ];
}

export function getPlaybookDetails(name: string): Playbook | undefined {
  return getBuiltInPlaybooks().find((playbook) => playbook.name === name);
}
