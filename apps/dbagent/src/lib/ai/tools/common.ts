import { tool } from 'ai';
import { z } from 'zod';
import { toolQueryRAG } from '~/lib/tools/rag';

export const getCurrentTime = tool({
  description: 'Get the current time',
  parameters: z.object({}),
  execute: async () => {
    const now = new Date();
    return now.toLocaleTimeString();
  }
});

export const queryRAG = tool({
  description: `Query extra knowledge of oceanbase database.Please input your question in a precise manner, and this tool will search the knowledge base using vector retrieval technology to return the most relevant information.`,
  parameters: z.object({
    query: z.string()
  }),
  execute: async ({ query }) => {
    try {
      return await toolQueryRAG(query, 2);
    } catch (error) {
      console.error('Error query rag:', error);
      return `Error query rag: ${error}`;
    }
  }
});

export const commonToolset = {
  getCurrentTime,
  queryRAG
};
