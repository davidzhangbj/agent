import { NextResponse } from 'next/server';
import { dbAddCustomTool } from '~/lib/db/custom-tool';
import { getUserSessionDBAccess } from '~/lib/db/db';

export async function POST(request: Request) {
  const { name, description, script } = await request.json();
  const dbAccess = await getUserSessionDBAccess();
  try {
    const tool = await dbAddCustomTool(dbAccess, { name, description, script });
    return NextResponse.json({ data: tool }, { status: 200 });
  } catch (error) {
    console.log('error: ', error);
    return NextResponse.json('Add Custom Tool Failed!', { status: 500 });
  }
}
