'use server';

import { getDefaultConnection } from '~/lib/db/connections';
import { getUserSessionDBAccess } from '~/lib/db/db';

// Server action to get completed tasks
export async function getCompletedTasks(projectId: string): Promise<string[]> {
  const dbAccess = await getUserSessionDBAccess();

  const completedTasks: string[] = [];
  const connection = await getDefaultConnection(dbAccess, projectId);
  if (!connection) {
    return [];
  }
  completedTasks.push('connect');
  return completedTasks;
}

export async function getCompletedTaskPercentage(projectId: string): Promise<number> {
  const completedTasks = await getCompletedTasks(projectId);
  return Math.round((completedTasks.length / 4) * 100);
}
