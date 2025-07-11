import { tool, Tool } from 'ai';
import { z } from 'zod';
import { DBAccess } from '~/lib/db/db';
import { getCustomPlaybookAndPlaybookTool, listCustomPlaybooksAndPlaybookTool } from '~/lib/tools/custom-playbooks';
import { getAgent, listPlaybooks } from '~/lib/tools/playbooks';
import { ToolsetGroup } from './types';

export function getPlaybookToolset(dbAccess: DBAccess, projectId: string): Record<string, Tool> {
  return new playbookTools(dbAccess, () => Promise.resolve({ projectId })).toolset();
}

function playbookFetchTool(execute: (name: string) => Promise<string>): Tool {
  return tool({
    description: `Get a agent contents by name. A agent is a list of steps to follow to achieve a goal. Follow it step by step.`,
    parameters: z.object({
      name: z.string()
    }),
    execute: async ({ name }: { name: string }) => execute(name)
  });
}

function playbookListTool(execute: () => Promise<string[]>): Tool {
  return tool({
    description: `List the available agents.`,
    parameters: z.object({}),
    execute: async () => execute()
  });
}

export const builtinPlaybookToolset = {
  getAgentTool: playbookFetchTool(async (name: string) => getAgent(name)),
  listAgentsTool: playbookListTool(async () => listPlaybooks())
};

export class playbookTools implements ToolsetGroup {
  #dbAccess: DBAccess;
  #connProjectId: () => Promise<{ projectId: string }>;

  constructor(dbAccess: DBAccess, getter: () => Promise<{ projectId: string }>) {
    this.#dbAccess = dbAccess;
    this.#connProjectId = getter;
  }

  toolset(): Record<string, Tool> {
    return {
      getAgentTool: this.getAgentTool(),
      listAgentsTool: this.listAgentsTool()
    };
  }

  private getAgentTool(): Tool {
    const db = this.#dbAccess;
    const getter = this.#connProjectId;
    return playbookFetchTool(async (name: string) => {
      const { projectId } = await getter();
      return await getCustomPlaybookAndPlaybookTool(db, name, projectId);
    });
  }

  private listAgentsTool(): Tool {
    const db = this.#dbAccess;
    const getter = this.#connProjectId;
    return playbookListTool(async () => {
      const { projectId } = await getter();
      return await listCustomPlaybooksAndPlaybookTool(db, projectId);
    });
  }
}
