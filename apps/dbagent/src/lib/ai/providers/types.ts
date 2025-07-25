import { LanguageModel, Provider as ProviderV2 } from 'ai';

export interface ProviderRegistry {
  listLanguageModels(): Model[];
  defaultLanguageModel(): Model;
  languageModel(modelId: string, useFallback?: boolean): ModelWithFallback;
}

export interface Model {
  info(): ProviderModel;
  instance(): LanguageModel;
}

export interface ModelWithFallback extends Model {
  isFallback: boolean;
  requestedModelId: string;
}

export type Provider = {
  info: ProviderInfo;
  models: ProviderModel[];
};

export type ProviderInfo = {
  name: string;
  id: string;
  kind: ProviderV2;
  fallback?: string;
};

export type ProviderModel = {
  id: string;
  name: string;
  private?: boolean;
};
