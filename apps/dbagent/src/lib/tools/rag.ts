import { getVectorSearchResult } from '../db/db';

export async function toolQueryRAG(query: string, topK: number): Promise<string> {
  try {
    const queryResult = await getVectorSearchResult(query, topK);
    return JSON.stringify(queryResult);
  } catch (error) {
    console.error('Error in toolQueryRAG:', error);
    return '';
  }
}
