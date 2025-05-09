// import { env as modelenv, pipeline } from '@xenova/transformers';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
// import path from 'path';
import OpenAI from 'openai';
import pg from 'pg';
import { toSql } from 'pgvector/pg';
import { requireUserSession } from '~/utils/route';
import { env } from '../env/server';
import { authenticatedUser } from './schema';
const client = new OpenAI({
  baseURL: env.CUSTOM_BASE_URL,
  apiKey: env.CUSTOM_API_KEY
});

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20
});

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
    const client = await pool.connect();
    try {
      const db = drizzle(client);
      return await callback({ db, userId: 'admin' });
    } finally {
      client.release(true);
    }
  }
}

// async function generateEmbedding(text: string): Promise<number[]> {
//   console.log('Starting embedding generation for text:', text.substring(0, 50) + '...');
//   const modelPath = path.resolve(process.cwd(), 'public', 'model');
//   console.log('Setting model path to:', modelPath);
//   modelenv.localModelPath = modelPath;
//   modelenv.allowRemoteModels = false;
//   try {
//     console.log('Loading feature extraction model...');
//     const extractor = await pipeline('feature-extraction', 'Xenova/bge-base-zh-v1.5');
//     console.log('Model loaded successfully');

//     console.log('Generating embedding...');
//     const output = await extractor(text, { pooling: 'mean', normalize: true });
//     console.log('Embedding generated successfully');

//     const embedding = toSql(Array.from(output.data));
//     console.log('Embedding converted to array, length:', embedding.length);
//     return embedding;
//   } catch (error) {
//     console.error('Error generating embedding:', error);
//     throw error;
//   }
// }

async function generateEmbedding2(text: string): Promise<number[]> {
  const completion = await client.embeddings.create({
    model: env.CUSTOM_EMBEDDING_MODEL_NAME || 'text-embedding-v3',
    input: text,
    encoding_format: 'float',
    dimensions: 768
  });
  // console.log('embedding', completion.data[0]?.embedding);
  if (!completion.data[0]?.embedding) {
    throw new Error('Embedding generation failed: no embedding returned.');
  }
  return toSql(completion.data[0].embedding);
}

export async function getVectorSearchResult(queryText: string, topK: number): Promise<string[]> {
  const client = await pool.connect();
  try {
    const queryEmbedding = await generateEmbedding2(queryText);
    const result = await client.query(
      `SELECT id, content, metadata, embedding <=> $1 as similarity
       FROM oba_obdoc
       ORDER BY similarity
       LIMIT $2`,
      [queryEmbedding, topK]
    );

    return result.rows.map((row) => row.content);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  } finally {
    client.release();
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
    const client = await pool.connect();
    try {
      const db = drizzle(client);
      await db.execute(sql.raw(`SET ROLE "${authenticatedUser.name}"`));
      await db.execute(sql.raw(`SET "app.current_user" = '${this._userId}'`));
      return await callback({ db, userId: this._userId });
    } finally {
      client.release(true);
    }
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
