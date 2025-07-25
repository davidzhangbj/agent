import {
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText
} from 'ai';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { NextRequest } from 'next/server';
import { generateTitleFromUserMessage } from '~/app/(main)/projects/[project]/chats/actions';
import { generateUUID } from '~/components/chat/utils';
import { getChatSystemPrompt } from '~/lib/ai/agent';
import { getLanguageModel } from '~/lib/ai/providers';
import { getTools } from '~/lib/ai/tools';
import { deleteChatById, getChatById, getChatsByProject, saveChat } from '~/lib/db/chats';
import { getConnection } from '~/lib/db/connections';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { getProjectById } from '~/lib/db/projects';
import { getTargetDbPool } from '~/lib/targetdb/db-oceanbase';
import { requireUserSession } from '~/utils/route';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const project = searchParams.get('project');
  if (!project) {
    return new Response('Project is required', { status: 400 });
  }

  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const dbAccess = await getUserSessionDBAccess();

  const chats = await getChatsByProject(dbAccess, { project, limit, offset });

  return Response.json({ chats });
}

export async function POST(request: Request) {
  try {
    const { id, messages, connectionId, model: modelId, useArtifacts } = await request.json();
    // const openai = createOpenAICompatible({
    //   baseURL: '',
    //   apiKey: '',
    //   name: 'custom'
    // });
    // const result = streamText({
    //   model: openai('qwen-max-latest'),
    //   messages: convertToModelMessages(messages)
    // });
    // return result.toUIMessageStreamResponse();
    const userId = await requireUserSession();
    const dbAccess = await getUserSessionDBAccess();
    const connection = await getConnection(dbAccess, connectionId);
    if (!connection) {
      console.error('Connection not found', connectionId);
      return new Response('Connection not found', { status: 400 });
    }

    const project = await getProjectById(dbAccess, connection.projectId);
    if (!project) {
      return new Response('Project not found', { status: 400 });
    }

    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById(dbAccess, { id });
    if (!chat) notFound();
    const poolConfig = { user: connection.username, password: connection.password };
    const targetDb = getTargetDbPool(connection.connectionString, poolConfig);
    const context = getChatSystemPrompt({ cloudProvider: project.cloudProvider, useArtifacts });
    const model = await getLanguageModel(modelId);

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const tools = await getTools({ project, connection: connection, targetDb, useArtifacts, userId, dataStream });

        const result = streamText({
          model: model.instance(),
          system: context,
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(20),
          experimental_transform: smoothStream({ chunking: /[\u4E00-\u9FFF]|\S+\s+/ }),
          tools,
          onChunk: (chunk) => {
            // console.log('chunk',chunk)
          }
        });
        // console.log('result:',result.content);
        dataStream.merge(result.toUIMessageStream());
      },
      onFinish: async ({ messages }) => {
        const title =
          !chat.title || chat.title === 'New chat'
            ? await generateTitleFromUserMessage({ message: userMessage })
            : chat.title;
        await saveChat(
          dbAccess,
          {
            ...chat,
            title,
            model: model.info().id
          },
          [
            {
              chatId: id,
              id: userMessage.id,
              projectId: connection.projectId,
              role: 'user',
              parts: JSON.stringify(userMessage.parts),
              createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            },
            {
              id: generateUUID(),
              projectId: connection.projectId,
              chatId: id,
              role: 'assistant',
              parts: JSON.stringify(messages?.at(-1)?.parts),
              createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            }
          ]
        );
      },
      onError: (error) => {
        console.error('Error in data stream:', error);
        return 'An error occurred while processing your request';
      }
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const dbAccess = await getUserSessionDBAccess();

  try {
    const chat = await getChatById(dbAccess, { id });
    if (!chat) notFound();

    await deleteChatById(dbAccess, { id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500
    });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const { title } = await request.json();
  if (!title) {
    return new Response('Title is required', { status: 400 });
  }

  const dbAccess = await getUserSessionDBAccess();

  try {
    const chat = await getChatById(dbAccess, { id });
    if (!chat) notFound();

    await saveChat(dbAccess, { ...chat, title });

    return new Response('Chat updated', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500
    });
  }
}

function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}
