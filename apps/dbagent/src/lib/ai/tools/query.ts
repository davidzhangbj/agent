import { tool, Tool } from 'ai';
import { z } from 'zod';
import { dbGetCustomTools } from '~/lib/db/custom-tool';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { Pool, withPoolConnection } from '~/lib/targetdb/db';

export async function getCustomQueryTools(targetDb: Pool) {
  const dbAccess = await getUserSessionDBAccess();
  const rows = await dbGetCustomTools(dbAccess);
  return rows.reduce(
    (acc, row) => {
      return {
        ...acc,
        [row.name]: tool({
          name: row.name,
          description: row.description ?? undefined,
          parameters: z.object({}),
          execute: async () => {
            withPoolConnection(targetDb, async (client) => client.query(row.script));
          }
        })
      };
    },
    {} as Record<string, Tool>
  );
}
