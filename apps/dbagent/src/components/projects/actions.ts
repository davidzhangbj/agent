'use server';

import { generateUUID } from '~/components/chat/utils';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { createProject, deleteProject, updateProject } from '~/lib/db/projects';
import { CloudProvider, Project } from '~/lib/db/schema-sqlite';

export async function actionCreateProject(name: string, cloudProvider: CloudProvider) {
  const dbAccess = await getUserSessionDBAccess();
  const id = generateUUID();
  return createProject(dbAccess, { id, name, cloudProvider });
}

export async function actionDeleteProject(id: string) {
  const dbAccess = await getUserSessionDBAccess();
  return deleteProject(dbAccess, { id });
}

export async function actionUpdateProject(id: string, update: Partial<Omit<Project, 'id'>>) {
  const dbAccess = await getUserSessionDBAccess();
  return updateProject(dbAccess, id, update);
}
