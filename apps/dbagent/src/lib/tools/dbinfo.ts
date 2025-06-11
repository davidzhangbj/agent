import { ClientBase, findTableSchema, getPerformanceSettings, getVacuumSettings } from '../targetdb/db';

export async function getPerformanceAndVacuumSettings(client: ClientBase): Promise<string> {
  const performanceSettings = await getPerformanceSettings(client);
  const vacuumSettings = await getVacuumSettings(client);

  return `
Performance settings: ${JSON.stringify(performanceSettings)}
Vacuum settings: ${JSON.stringify(vacuumSettings)}
`;
}

export async function toolFindTableSchema(client: ClientBase, tableName: string): Promise<string> {
  try {
    const result = await findTableSchema(client, tableName);
    return result;
  } catch (error) {
    console.error('Error finding schema for table', error);
    return 'public'; // Default to public on error
  }
}
