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
并且使用工具 queryRAG 查询 explain 相关的文档，帮助解释 explain 的结果。
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

export function getPlaybook(name: string): string {
  switch (name) {
    case 'oceanbaseSlowQuery':
      return OCEANBASE_SLOW_QUERIES_PLAYBOOK;
    case 'oceanbaseLockConflict':
      return OCEANBASE_INVESTIGATE_LOCK_CONFLICT;
    default:
      return `Error:Playbook ${name} not found`;
  }
}

export function listPlaybooks(): string[] {
  //TODO: add the custom playbooks
  return ['oceanbaseSlowQuery', 'oceanbaseLockConflict'];
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
    }
  ];
}

export function getPlaybookDetails(name: string): Playbook | undefined {
  return getBuiltInPlaybooks().find((playbook) => playbook.name === name);
}
