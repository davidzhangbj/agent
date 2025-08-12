import { DataStreamWriter } from 'ai';
import { DBAccess } from '~/lib/db/db';
import { ArtifactDocument } from '~/lib/db/schema';
import { ArtifactKind } from './artifact';
import { createDocumentHandler } from './document-handler';
import { sheetDocumentHandler } from './sheet/server';
import { textDocumentHandler } from './text/server';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  dataStream: DataStreamWriter;
  userId: string;
  projectId: string;
  dbAccess: DBAccess;
}

export interface UpdateDocumentCallbackProps {
  document: ArtifactDocument;
  description: string;
  dataStream: DataStreamWriter;
  userId: string;
  projectId: string;
  dbAccess: DBAccess;
}

export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}

export { createDocumentHandler };

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: Array<DocumentHandler> = [textDocumentHandler, sheetDocumentHandler];

export const artifactKinds = ['text', 'sheet'] as const;
