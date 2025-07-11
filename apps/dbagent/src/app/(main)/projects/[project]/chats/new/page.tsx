import { Message as SDKMessage } from '@ai-sdk/ui-utils';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { generateUUID } from '~/components/chat/utils';
import { saveChat } from '~/lib/db/chats';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { getScheduleRun } from '~/lib/db/schedule-runs';
import { getSchedule } from '~/lib/db/schedules';
import { requireUserSession } from '~/utils/route';

type PageParams = {
  project: string;
};

type SearchParams = {
  scheduleRun?: string;
  playbook?: string;
  start?: string;
  tool?: string;
};

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { project } = await params;
  const { scheduleRun, playbook, start, tool } = await searchParams;

  const userId = await requireUserSession();
  const dbAccess = await getUserSessionDBAccess();
  const chatId = generateUUID();

  if (scheduleRun) {
    const run = await getScheduleRun(dbAccess, scheduleRun);
    const schedule = await getSchedule(dbAccess, run.scheduleId);
    const messages: SDKMessage[] = JSON.parse(run.messages);

    await saveChat(
      dbAccess,
      {
        id: chatId,
        projectId: project,
        userId: schedule.userId,
        model: schedule.model,
        title: `Schedule: ${schedule.playbook} - Run: ${run.id}`,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      },
      messages.map((message) => ({
        id: generateUUID(),
        chatId,
        projectId: project,
        role: message.role,
        parts: JSON.stringify(
          message.parts ??
            (message.content?.split('\n\n').map((text) => ({
              type: 'text',
              text
            })) ||
              [])
        ),
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      }))
    );
  } else if (playbook) {
    console.log('playbook', playbook);
    await saveChat(
      dbAccess,
      {
        id: chatId,
        projectId: project,
        userId: userId,
        model: 'chat',
        title: `Playbook ${playbook}`,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      },
      [
        {
          id: generateUUID(),
          chatId,
          projectId: project,
          role: 'user',
          parts: JSON.stringify([
            {
              type: 'text',
              text: `运行 agent ${playbook}`
            }
          ]),
          createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        }
      ]
    );
  } else if (tool) {
    console.log('tool', tool);
    await saveChat(
      dbAccess,
      {
        id: chatId,
        projectId: project,
        userId,
        model: 'chat',
        title: `Tool ${tool}`,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      },
      [
        {
          id: generateUUID(),
          chatId,
          projectId: project,
          role: 'user',
          parts: JSON.stringify([
            {
              type: 'text',
              text: `运行 tool ${tool}`
            }
          ]),
          createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        }
      ]
    );
  } else if (start) {
    await saveChat(
      dbAccess,
      {
        id: chatId,
        projectId: project,
        userId,
        model: 'chat',
        title: `New chat`,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      },
      [
        {
          id: generateUUID(),
          chatId,
          projectId: project,
          role: 'user',
          parts: JSON.stringify([
            {
              type: 'text',
              text: `Hi! I'd like an initial assessment of my database. Please analyze its configuration, settings, and current activity to provide recommendations for optimization and potential improvements.`
            }
          ]),
          createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        }
      ]
    );
  } else {
    await saveChat(dbAccess, {
      id: chatId,
      projectId: project,
      userId,
      model: 'chat',
      title: 'New chat',
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    });
  }

  redirect(`/projects/${project}/chats/${chatId}`);
}
