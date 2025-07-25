import {
  MetadataExtractor,
  OpenAICompatibleChatSettings,
  OpenAICompatibleCompletionLanguageModel,
  // OpenAICompatibleChatLanguageModel,
  OpenAICompatibleCompletionSettings,
  OpenAICompatibleEmbeddingModel,
  OpenAICompatibleEmbeddingSettings,
  OpenAICompatibleImageModel,
  OpenAICompatibleImageSettings,
  OpenAICompatibleProvider,
  OpenAICompatibleProviderSettings,
  ProviderErrorStructure
} from '@ai-sdk/openai-compatible';
import { LanguageModelV1ObjectGenerationMode } from '@ai-sdk/provider';
import { FetchFunction, withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { OpenAICompatibleChatLanguageModel } from './openai-compatible-chat-language-model';
export type OpenAICompatibleChatConfig = {
  provider: string;
  headers: () => Record<string, string | undefined>;
  url: (options: { modelId: string; path: string }) => string;
  fetch?: FetchFunction;
  includeUsage?: boolean;
  errorStructure?: ProviderErrorStructure<any>;
  metadataExtractor?: MetadataExtractor;

  /**
  Default object generation mode that should be used with this model when
  no mode is specified. Should be the mode with the best results for this
  model. `undefined` can be specified if object generation is not supported.
    */
  defaultObjectGenerationMode?: LanguageModelV1ObjectGenerationMode;

  /**
   * Whether the model supports structured outputs.
   */
  supportsStructuredOutputs?: boolean;
};
/**
Create an OpenAICompatible provider instance.
 */
export function createOpenAICompatible<
  CHAT_MODEL_IDS extends string,
  COMPLETION_MODEL_IDS extends string,
  EMBEDDING_MODEL_IDS extends string,
  IMAGE_MODEL_IDS extends string
>(
  options: OpenAICompatibleProviderSettings
): OpenAICompatibleProvider<CHAT_MODEL_IDS, COMPLETION_MODEL_IDS, EMBEDDING_MODEL_IDS, IMAGE_MODEL_IDS> {
  const baseURL = withoutTrailingSlash(options.baseURL);
  const providerName = options.name;

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getHeaders = () => ({
    ...(options.apiKey && { Authorization: `Bearer ${options.apiKey}` }),
    ...options.headers
  });

  const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
    provider: `${providerName}.${modelType}`,
    url: ({ path }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: getHeaders,
    fetch: options.fetch
  });

  const createLanguageModel = (
    modelId: CHAT_MODEL_IDS,
    settings: OpenAICompatibleChatSettings = {},
    config?: Partial<OpenAICompatibleChatConfig>
  ) => createChatModel(modelId, settings, config);

  const createChatModel = (
    modelId: CHAT_MODEL_IDS,
    settings: OpenAICompatibleChatSettings = {},
    config?: Partial<OpenAICompatibleChatConfig>
  ) =>
    new OpenAICompatibleChatLanguageModel(modelId, settings, {
      ...getCommonModelConfig('chat'),
      defaultObjectGenerationMode: 'tool',
      ...config
    });

  const createCompletionModel = (modelId: COMPLETION_MODEL_IDS, settings: OpenAICompatibleCompletionSettings = {}) =>
    new OpenAICompatibleCompletionLanguageModel(modelId, settings, getCommonModelConfig('completion'));

  const createEmbeddingModel = (modelId: EMBEDDING_MODEL_IDS, settings: OpenAICompatibleEmbeddingSettings = {}) =>
    new OpenAICompatibleEmbeddingModel(modelId, settings, getCommonModelConfig('embedding'));

  const createImageModel = (modelId: IMAGE_MODEL_IDS, settings: OpenAICompatibleImageSettings = {}) =>
    new OpenAICompatibleImageModel(modelId, settings, getCommonModelConfig('image'));

  const provider = (
    modelId: CHAT_MODEL_IDS,
    settings?: OpenAICompatibleChatSettings,
    config?: Partial<OpenAICompatibleChatConfig>
  ) => createLanguageModel(modelId, settings, config);

  provider.languageModel = createLanguageModel;
  provider.chatModel = createChatModel;
  provider.completionModel = createCompletionModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.imageModel = createImageModel;

  return provider as OpenAICompatibleProvider<
    CHAT_MODEL_IDS,
    COMPLETION_MODEL_IDS,
    EMBEDDING_MODEL_IDS,
    IMAGE_MODEL_IDS
  >;
}
