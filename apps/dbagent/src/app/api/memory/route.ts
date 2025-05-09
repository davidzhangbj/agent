import MemoryClient from 'mem0ai';
import { NextRequest } from 'next/server';
import { env } from '~/lib/env/server';
import { requireUserSession } from '~/utils/route';

let memory: MemoryClient | null = null;

if (env.MEM0_API_KEY) {
  memory = new MemoryClient({ apiKey: env.MEM0_API_KEY });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserSession();
  const { content } = await request.json();

  if (!content) {
    return new Response('Missing content', { status: 400 });
  }

  try {
    if (memory) {
      await memory.add(content, { user_id: userId });
      return new Response('Memory added', { status: 200 });
    }
    return new Response('Memory service not configured', { status: 200 });
  } catch (error) {
    console.error('Failed to add memory:', error);
    return new Response('Failed to add memory', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = await requireUserSession();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return new Response('Missing query', { status: 400 });
  }

  try {
    if (memory) {
      const results = await memory.search(query, { user_id: userId });
      return Response.json({ results }, { status: 200 });
    }
    return Response.json({ results: [] }, { status: 200 });
  } catch (error) {
    console.error('Failed to search memory:', error);
    return new Response('Failed to search memory', { status: 500 });
  }
}
