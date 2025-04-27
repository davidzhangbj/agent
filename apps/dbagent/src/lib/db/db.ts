import { pipeline } from '@xenova/transformers';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { toSql } from 'pgvector/pg';
import { auth } from '~/auth';
import { env } from '../env/server';
import { authenticatedUser } from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20
});

export async function queryDb<T>(
  callback: (params: { db: ReturnType<typeof drizzle>; userId: string }) => Promise<T>,
  { admin = false, asUserId }: { admin?: boolean; asUserId?: string } = {}
): Promise<T> {
  const session = await auth();
  const userId = asUserId ?? session?.user?.id ?? '';

  // We'll use userId in raw SQL, so validate that it only contains valid UUID characters
  if (userId !== '' && userId !== 'local' && !/^[0-9a-f-]*$/i.test(userId)) {
    throw new Error('Invalid user ID format');
  }

  const client = await pool.connect();

  try {
    const db = drizzle(client);
    if (!admin) {
      if (userId === '') {
        throw new Error('Unable to query the database without a user');
      }

      await db.execute(sql.raw(`SET ROLE "${authenticatedUser.name}"`));
      await db.execute(sql.raw(`SET "app.current_user" = '${userId}'`));
    }

    return await callback({ db, userId });
  } finally {
    // Destroy the client to release the connection back to the pool
    client.release(true);
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  console.log('Starting embedding generation for text:', text.substring(0, 50) + '...');
  // const modelPath = path.resolve(process.cwd(), 'public', 'model');
  // console.log('Setting model path to:', modelPath);
  // modelenv.localModelPath = modelPath;
  // modelenv.allowRemoteModels = false;
  try {
    console.log('Loading feature extraction model...');
    const extractor = await pipeline('feature-extraction', 'Xenova/bge-base-zh-v1.5');
    console.log('Model loaded successfully');

    console.log('Generating embedding...');
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    console.log('Embedding generated successfully');

    const embedding = toSql(Array.from(output.data));
    console.log('Embedding converted to array, length:', embedding.length);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function getVectorSearchResult(queryText: string, topK: number): Promise<string[]> {
  const client = await pool.connect();
  try {
    const queryEmbedding = await generateEmbedding(queryText);

    const result = await client.query(
      `SELECT id, content, metadata, embedding <=> $1 as similarity
       FROM document_embeddings
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
