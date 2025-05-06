import { eq } from 'drizzle-orm';
import { DBAccess } from './db';
import { CustomToolInsert, customTools } from './schema';

export async function dbAddCustomTool(dbAccess: DBAccess, input: CustomToolInsert) {
  return await dbAccess.query(async ({ db }) => {
    const result = await db.insert(customTools).values(input).returning();

    const tool = result[0];

    if (!tool) {
      throw new Error('Failed to create server');
    }
    return tool;
  });
}

export async function dbGetCustomTools(dbAccess: DBAccess) {
  return dbAccess.query(async ({ db }) => {
    return await db.select().from(customTools);
  });
}

export async function dbGetCustomToolByName(dbAccess: DBAccess, { name }: { name: string }) {
  return dbAccess.query(async ({ db }) => {
    const result = await db.select().from(customTools).where(eq(customTools.name ,name));
    return result[0];
  });
}

export async function dbDeleteCustomToolByName(dbAccess: DBAccess, { name }: { name: string }) {
  return dbAccess.query(async ({ db }) => {
    return await db.delete(customTools).where(eq(customTools.name ,name));
  });
}
