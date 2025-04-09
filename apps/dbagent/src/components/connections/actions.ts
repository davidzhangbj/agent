'use server';

import { revalidatePath } from 'next/cache';
import { addConnection, makeConnectionDefault, updateConnection } from '~/lib/db/connections';
import { getTargetDbConnection } from '~/lib/targetdb/db-oceanbase';

function translateError(error: string) {
  if (error.includes('uq_connections_connection_string')) {
    return 'A connection with this connection string already exists.';
  }
  if (error.includes('uq_connections_name')) {
    return 'A connection with this name already exists.';
  }
  return error;
}

export async function actionSaveConnection({
  projectId,
  id,
  name,
  connectionString,
  username,
  password
}: {
  projectId: string;
  id: string | null;
  name: string;
  connectionString: string;
  username: string;
  password: string;
}) {
  try {
    const validateResult = await validateConnection(connectionString, username, password);
    if (!validateResult.success) {
      return validateResult;
    }

    if (id) {
      await updateConnection({ id, name, connectionString, username, password });
      return { success: true, message: 'Connection updated successfully' };
    } else {
      await addConnection({ projectId, name, connectionString, username, password });
      return { success: true, message: 'Connection added successfully' };
    }
  } catch (error) {
    console.error('Error saving connection:', error);
    return { success: false, message: `Failed to save connection. ${translateError((<Error>error).message)}` };
  }
}

export async function actionMakeConnectionDefault(id: string) {
  try {
    const result = await makeConnectionDefault(id);
    revalidatePath('/connections');
    return result;
  } catch (error) {
    console.error('Error making connection default:', error);
    return { success: false, message: 'Failed to make connection default' };
  }
}

export async function validateConnection(connectionString: string, username: string, password: string) {
  const client = await getTargetDbConnection(connectionString, username, password);
  try {
    const versionResult = await client.query('SELECT version() as version');
    const version = (versionResult[0] as unknown as [{ version: string }])[0].version;
    console.log('Connection validated successfully. Postgres version: ', version);
    return { success: true, message: `Connection validated successfully.` };
  } catch (error) {
    console.error('Error validating connection:', error);
    return { success: false, message: `Failed to validate connection. ${error}` };
  }
}
