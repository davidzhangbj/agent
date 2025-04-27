import { getVectorSearchResult } from '../db/db';

export async function toolQueryRAG(query: string, topK: number): Promise<string> {
  const queryResult = await getVectorSearchResult(query, topK);
  const result = JSON.stringify(queryResult);
  console.log(result);
  return result;
}
