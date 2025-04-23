import {
  ClientBase,
  getSqlLockWaitTimeout,
  getSqlOfBlockTrx,
  getSqlOfHoldLockTrx,
  getTrxOfBlock,
  getTrxOfHoldLock
} from '../targetdb/db-oceanbase';

export async function toolGetTrxOfHoldLock(client: ClientBase): Promise<string> {
  const result = await getTrxOfHoldLock(client);
  return JSON.stringify(result);
}

export async function toolGetSqlOfHoldLockTrx(client: ClientBase, tx_id: string): Promise<string> {
  const result = await getSqlOfHoldLockTrx(client, tx_id);
  return JSON.stringify(result);
}

export async function toolGetTrxOfBlock(client: ClientBase): Promise<string> {
  const result = await getTrxOfBlock(client);
  return JSON.stringify(result);
}

export async function toolGetSqlOfBlockTrx(client: ClientBase, tx_id: string): Promise<string> {
  const result = await getSqlOfBlockTrx(client, tx_id);
  return JSON.stringify(result);
}

export async function toolGetSqlLockWaitTimeout(client: ClientBase): Promise<string> {
  const result = await getSqlLockWaitTimeout(client);
  return JSON.stringify(result);
}
