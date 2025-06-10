import { drizzle } from 'drizzle-orm/libsql';

import { requireUserSession } from '~/utils/route';
import { env } from '../env/server';

/**
 * Interface for database access that provides a consistent way to execute queries
 * with proper user context and role settings.
 */
export interface DBAccess {
  /**
   * Executes a database query with the appropriate user context and role settings.
   * @param callback Function that receives the database instance and user ID
   * @returns The result of the callback function
   */
  query: <T>(callback: (params: { db: ReturnType<typeof drizzle>; userId: string }) => Promise<T>) => Promise<T>;
}

/**
 * Database access implementation for admin operations.
 * This bypasses user role restrictions and sets the user ID to 'admin'.
 */
export class DBAdminAccess implements DBAccess {
  async query<T>(callback: (params: { db: ReturnType<typeof drizzle>; userId: string }) => Promise<T>): Promise<T> {
    const db = drizzle(env.DATABASE_URL);
    return await callback({ db, userId: 'admin' });
  }
}

/**
 * Database access implementation for user-specific operations.
 * This sets the appropriate user role and user ID for the query.
 */
export class DBUserAccess implements DBAccess {
  private readonly _userId: string;

  constructor(userId: string) {
    if (userId !== '' && userId !== 'local' && !/^[0-9a-f-]*$/i.test(userId)) {
      throw new Error('Invalid user ID format');
    }
    this._userId = userId;
  }

  async query<T>(callback: (params: { db: ReturnType<typeof drizzle>; userId: string }) => Promise<T>): Promise<T> {
    const db = drizzle(env.DATABASE_URL);
    return await callback({ db, userId: this._userId });
  }
}

export async function getUserSessionDBAccess(): Promise<DBAccess> {
  const userId = await requireUserSession();
  return new DBUserAccess(userId);
}

export async function getUserDBAccess(userId: string | undefined | null): Promise<DBAccess> {
  if (!userId) return await getUserSessionDBAccess();

  return new DBUserAccess(userId);
}

export function getAdminAccess(): DBAccess {
  return new DBAdminAccess();
}
