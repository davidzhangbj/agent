import { smoothStream, streamText } from 'ai';
import { getModelInstance } from '~/lib/ai/agent';
import { updateDocumentPrompt } from '~/lib/ai/prompts';
import { createDocumentHandler } from '../server';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: await getModelInstance('chat'),
      system: 'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: title
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: 'data-text',

          data: [
            {
              type: 'text',
              content: text
            }
          ]
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: await getModelInstance('chat'),
      system: updateDocumentPrompt(document.content, 'text'),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      providerOptions: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content
          }
        }
      }
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        const { text } = delta;

        draftContent += text;
        dataStream.write({
          type: 'data-text',

          data: [
            {
              type: 'text',
              content: text
            }
          ]
        });
      }
    }

    return draftContent;
  }
});
