import { tool, Tool } from 'ai';
import { z } from 'zod';
import { dbGetCustomTools } from '~/lib/db/custom-tool';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { Pool, withPoolConnection } from '~/lib/targetdb/db-oceanbase';

export async function getCustomQueryTools(targetDb: Pool) {
  const dbAccess = await getUserSessionDBAccess();
  const rows = await dbGetCustomTools(dbAccess);
  return rows.reduce(
    (acc, row) => {
      return {
        ...acc,
        [row.name]: tool({
          description: row.description ?? undefined,
          parameters: z.object({}),
          execute: async () => {
            try {
              const result = await withPoolConnection(targetDb, async (client) => client.query(row.script));
              console.log('result:', result);
              return result;
            } catch (error) {
              console.error('An error occurred:', error);
              return [[error], []];
            }
          }
        })
      };
    },
    {} as Record<string, Tool>
  );
}
