'use server';

import { revalidatePath } from 'next/cache';
import {
  addConnection,
  deleteConnection,
  getConnection,
  listConnections,
  makeConnectionDefault,
  updateConnection
} from '~/lib/db/connections';
import { getTargetDbConnection } from '~/lib/targetdb/db';

export async function actionListConnections() {
  return await listConnections();
}

function translateError(error: string) {
  if (error.includes('connections_connstring_unique')) {
    return 'A connection with this connection string already exists.';
  }
  if (error.includes('connections_name_unique')) {
    return 'A connection with this name already exists.';
  }
  return error;
}

export async function actionSaveConnection(id: number | null, name: string, connstring: string) {
  try {
    const validateResult = await validateConnection(connstring);
    if (!validateResult.success) {
      return validateResult;
    }

    if (id) {
      await updateConnection({ id: id, name: name, connstring: connstring });
      return { success: true, message: 'Connection updated successfully' };
    } else {
      await addConnection({ name: name, connstring: connstring });
      return { success: true, message: 'Connection added successfully' };
    }
  } catch (error) {
    console.error('Error saving connection:', error);
    return { success: false, message: `Failed to save connection. ${translateError((<Error>error).message)}` };
  }
}

export async function actionMakeConnectionDefault(id: number) {
  try {
    const result = await makeConnectionDefault(id);
    revalidatePath('/connections');
    return result;
  } catch (error) {
    console.error('Error making connection default:', error);
    return { success: false, message: 'Failed to make connection default' };
  }
}

export async function actionGetConnection(id: number) {
  return await getConnection(id);
}

export async function actionDeleteConnection(id: number) {
  return await deleteConnection(id);
}

export async function validateConnection(connstring: string) {
  try {
    const client = await getTargetDbConnection(connstring);

    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    await client.end();
    console.log('Connection validated successfully. Postgres version: ', version);
    return { success: true, message: `Connection validated successfully.` };
  } catch (error) {
    console.error('Error validating connection:', error);
    return { success: false, message: `Failed to validate connection. ${error}` };
  }
}
