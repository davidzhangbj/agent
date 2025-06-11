import { UIMessage } from 'ai';
import { parse } from 'date-fns';
import { DataStreamHandler } from '~/components/chat/artifacts/data-stream-handler';
import { Chat } from '~/components/chat/chat';
import { getDefaultLanguageModel } from '~/lib/ai/providers';
import { getMessagesByChatId } from '~/lib/db/chats';
import { listConnections } from '~/lib/db/connections';
import { getUserSessionDBAccess } from '~/lib/db/db';
import { Message } from '~/lib/db/schema-sqlite';

type PageParams = {
  project: string;
  chat: string;
};

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { project: projectId, chat: chatId } = await params;

  const suggestedActions = [
    {
      title: 'Are there any slow queries with my database?',
      action: 'Are there any slow queries with my database?'
    }
  ];

  const dbAccess = await getUserSessionDBAccess();
  const connections = await listConnections(dbAccess, projectId);
  const defaultLanguageModel = await getDefaultLanguageModel();

  const chat = await getMessagesByChatId(dbAccess, { id: chatId });

  function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    console.log('messages', messages);
    return messages.map((message) => {
      let parsedParts: any[] = [];
      if (message.parts) {
        parsedParts = JSON.parse(message.parts); // 尝试解析 JSON 字符串
      }
      return {
        id: message.id,
        parts: parsedParts ?? [],
        role: message.role,
        // Note: content will soon be deprecated in @ai-sdk/react
        content:
          parsedParts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('\n')
            .trim() ?? '',
        createdAt: parse(message.createdAt, 'yyyy-MM-dd HH:mm:ss', new Date())
      };
    });
  }

  return (
    <>
      <Chat
        key={`chat-${chatId}`}
        id={chatId}
        projectId={projectId}
        defaultLanguageModel={chat.model ?? defaultLanguageModel.info().id}
        connections={connections}
        initialMessages={convertToUIMessages(chat.messages)}
        suggestedActions={suggestedActions}
      />

      <DataStreamHandler id={chatId} />
    </>
  );
}
