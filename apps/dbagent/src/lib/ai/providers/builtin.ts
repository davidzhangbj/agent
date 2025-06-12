// import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import { env } from '~/lib/env/server';

import { Model, ModelWithFallback, Provider, ProviderInfo, ProviderModel, ProviderRegistry } from './types';

type BuiltinProvider = Provider & {
  models: BuiltinProviderModel[];
};

type BuiltinProviderModel = ProviderModel & {
  providerId: string;
};

class BuiltinModel implements Model {
  #model: BuiltinProviderModel;
  #provider: ProviderInfo;

  constructor(provider: ProviderInfo, model: BuiltinProviderModel) {
    this.#model = model;
    this.#provider = provider;
  }

  info(): BuiltinProviderModel {
    return this.#model;
  }

  instance(): LanguageModel {
    const model = this.info();
    return this.#provider.kind.languageModel(model.providerId);
  }
}
const config = {
  baseURL: env.CUSTOM_BASE_URL,
  apiKey: env.CUSTOM_API_KEY
};
const openai = createOpenAI(config);
const llmModel = env.CUSTOM_CHAT_MODEL_NAME || 'qwen-max-latest';
const builtinOpenAIModels: BuiltinProvider = {
  info: {
    name: 'OpenAI',
    id: 'openai',
    kind: openai,
    fallback: 'gpt-4o'
  },
  models: [
    {
      id: 'openai:gpt-4.1',
      providerId: llmModel,
      // name: 'GPT-4.1'
      name: llmModel
    }
  ]
};

const builtinProviderModels: Record<string, BuiltinModel> = Object.fromEntries(
  [builtinOpenAIModels].flatMap((p) => {
    return p.models.map((model) => {
      const modelInstance = new BuiltinModel(p.info, model as BuiltinProviderModel);
      return [modelInstance.info().id, modelInstance];
    });
  })
);

export const defaultLanguageModel = builtinProviderModels['openai:gpt-4.1']!;

const builtinCustomModels: Record<string, BuiltinModel> = {
  chat: defaultLanguageModel,
  // title: builtinProviderModels['openai:gpt-4.1-mini']!,
  // summary: builtinProviderModels['openai:gpt-4.1-mini']!
  title: defaultLanguageModel,
  summary: defaultLanguageModel
};

const builtinModels: Record<string, BuiltinModel> = {
  ...builtinProviderModels,
  ...builtinCustomModels
};

class BuiltinProviderRegistry implements ProviderRegistry {
  listLanguageModels(): Model[] {
    return Object.values(builtinProviderModels);
  }

  defaultLanguageModel(): Model {
    return defaultLanguageModel;
  }

  languageModel(id: string, useFallback?: boolean): ModelWithFallback {
    const model = builtinModels[id];
    if (!model) {
      throw new Error(`Model ${id} not found`);
    }
    return {
      info: () => model.info(),
      instance: () => model.instance(),
      isFallback: useFallback ?? false,
      requestedModelId: id
    } as ModelWithFallback;
  }
}

const builtinProviderRegistry = new BuiltinProviderRegistry();

export function getBuiltinProviderRegistry(): ProviderRegistry {
  return builtinProviderRegistry;
}
