import { Message as SDKMessage } from '@ai-sdk/ui-utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, index, int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const connections = sqliteTable(
  'connections',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    name: text('name').notNull(),
    isDefault: int('is_default').default(1).notNull(),
    connectionString: text('connection_string').notNull(),
    username: text('username').notNull(),
    password: text('password').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_connections_project'
    }).onDelete('cascade'),
    unique('uq_connections_name').on(table.projectId, table.name),
    unique('uq_connections_connection_string').on(table.projectId, table.connectionString),
    index('idx_connections_project_id').on(table.projectId)
  ]
);

export type Connection = InferSelectModel<typeof connections>;
export type ConnectionInsert = InferInsertModel<typeof connections>;

export const connectionInfo = sqliteTable(
  'connection_info',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    connectionId: text('connection_id').notNull(),
    type: text('type').notNull(),
    data: text('data').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_connection_info_project'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.connectionId],
      foreignColumns: [connections.id],
      name: 'fk_connection_info_connection'
    }).onDelete('cascade'),
    unique('uq_connection_info').on(table.connectionId, table.type),
    index('idx_connection_info_connection_id').on(table.connectionId),
    index('idx_connection_info_project_id').on(table.projectId)
  ]
);

export type ConnectionInfo = InferSelectModel<typeof connectionInfo>;
export type ConnectionInfoInsert = InferInsertModel<typeof connectionInfo>;

export const integrations = sqliteTable(
  'integrations',
  {
    id: int().primaryKey({ autoIncrement: true }),
    projectId: text('project_id').notNull(),
    name: text('name').notNull(),
    data: text('data').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_integrations_project'
    }).onDelete('cascade'),
    unique('uq_integrations_name').on(table.projectId, table.name),
    index('idx_integrations_project_id').on(table.projectId)
  ]
);

export type Integration = InferSelectModel<typeof integrations>;
export type IntegrationInsert = InferInsertModel<typeof integrations>;

export const schedules = sqliteTable(
  'schedules',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    userId: text('user_id').notNull(),
    connectionId: text('connection_id').notNull(),
    playbook: text('playbook', { length: 255 }).notNull(),
    scheduleType: text('schedule_type', { length: 255 }).notNull(),
    cronExpression: text('cron_expression', { length: 255 }),
    additionalInstructions: text('additional_instructions'),
    minInterval: int('min_interval'),
    maxInterval: int('max_interval'),
    enabled: int('enabled').default(1).notNull(),
    lastRun: text('last_run'),
    nextRun: text('next_run'),
    status: text('status').default('disabled').notNull(),
    failures: int('failures').default(0),
    keepHistory: int('keep_history').default(300).notNull(),
    model: text('model').notNull(),
    maxSteps: int('max_steps'),
    notifyLevel: text('notify_level').default('alert').notNull(),
    extraNotificationText: text('extra_notification_text')
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_schedules_project'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.connectionId],
      foreignColumns: [connections.id],
      name: 'fk_schedules_connection'
    }).onDelete('cascade'),
    index('idx_schedules_project_id').on(table.projectId),
    index('idx_schedules_connection_id').on(table.connectionId),
    index('idx_schedules_status').on(table.status),
    index('idx_schedules_next_run').on(table.nextRun),
    index('idx_schedules_enabled').on(table.enabled)
  ]
);

export type Schedule = InferSelectModel<typeof schedules>;
export type ScheduleInsert = InferInsertModel<typeof schedules>;

export const scheduleRuns = sqliteTable(
  'schedule_runs',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    scheduleId: text('schedule_id').notNull(),
    createdAt: text('created_at').notNull(),
    result: text('result').notNull(),
    summary: text('summary'),
    notificationLevel: text('notification_level').default('info').notNull(),
    messages: text('messages').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_schedule_runs_project'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.scheduleId],
      foreignColumns: [schedules.id],
      name: 'fk_schedule_runs_schedule'
    }).onDelete('cascade'),
    index('idx_schedule_runs_created_at').on(table.scheduleId, table.createdAt),
    index('idx_schedule_runs_schedule_id').on(table.scheduleId),
    index('idx_schedule_runs_project_id').on(table.projectId),
    index('idx_schedule_runs_notification_level').on(table.notificationLevel)
  ]
);

export type ScheduleRun = InferSelectModel<typeof scheduleRuns>;
export type ScheduleRunInsert = InferInsertModel<typeof scheduleRuns>;

export const projects = sqliteTable('projects', {
  id: text().primaryKey(),
  name: text('name').notNull(),
  cloudProvider: text('cloud_provider').notNull()
});

export type Project = InferSelectModel<typeof projects>;
export type ProjectInsert = InferInsertModel<typeof projects>;

export const projectMembers = sqliteTable(
  'project_members',
  {
    id: int().primaryKey({ autoIncrement: true }),
    projectId: text('project_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role').default('member').notNull(),
    addedAt: text('added_at').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_project_members_project'
    }).onDelete('cascade'),
    unique('uq_project_members_user_project').on(table.projectId, table.userId),
    index('idx_project_members_project_id').on(table.projectId)
    // Project members has an "allow all" policy, to avoid circular dependencies.
    // Instead, we use the project policies to control access to project members.
  ]
);

export type ProjectMember = InferSelectModel<typeof projectMembers>;
export type ProjectMemberInsert = InferInsertModel<typeof projectMembers>;

export const chats = sqliteTable(
  'chats',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    createdAt: text('created_at').notNull(),
    title: text('title').notNull(),
    model: text('model').notNull(),
    userId: text('user_id').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_chats_project'
    }).onDelete('cascade'),
    index('idx_chats_project_id').on(table.projectId),
    index('idx_chats_user_id').on(table.userId)
  ]
);

export type Chat = InferSelectModel<typeof chats>;
export type ChatInsert = InferInsertModel<typeof chats>;

export const messages = sqliteTable(
  'messages',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    chatId: text('chat_id').notNull(),
    role: text('role').$type<SDKMessage['role']>().notNull(),
    parts: text('parts').notNull(),
    createdAt: text('created_at').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_messages_project'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.chatId],
      foreignColumns: [chats.id],
      name: 'fk_messages_chat'
    }).onDelete('cascade'),
    index('idx_messages_project_id').on(table.projectId),
    index('idx_messages_chat_id').on(table.chatId)
  ]
);

export type Message = InferSelectModel<typeof messages>;
export type MessageInsert = InferInsertModel<typeof messages>;

export const messageVotes = sqliteTable(
  'message_votes',
  {
    projectId: text('project_id').notNull(),
    chatId: text('chat_id').notNull(),
    messageId: text('message_id').notNull(),
    userId: text('user_id').notNull(),
    isUpvoted: int('is_upvoted').notNull(),
    createdAt: text('created_at').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.messageId, table.userId] }),
    foreignKey({
      columns: [table.chatId],
      foreignColumns: [chats.id],
      name: 'fk_votes_chat'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.messageId],
      foreignColumns: [messages.id],
      name: 'fk_message_votes_message'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_message_votes_project'
    }).onDelete('cascade'),
    index('idx_message_votes_chat_id').on(table.chatId),
    index('idx_message_votes_message_id').on(table.messageId),
    index('idx_message_votes_project_id').on(table.projectId),
    index('idx_message_votes_user_id').on(table.userId)
  ]
);

export type MessageVote = InferSelectModel<typeof messageVotes>;
export type MessageVoteInsert = InferInsertModel<typeof messageVotes>;

export const artifactDocuments = sqliteTable(
  'artifact_documents',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    createdAt: text('created_at').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: text('kind', { enum: ['text', 'sheet'] })
      .notNull()
      .default('text'),
    userId: text('user_id').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_artifact_documents_project'
    }).onDelete('cascade'),
    index('idx_artifact_documents_project_id').on(table.projectId),
    index('idx_artifact_documents_user_id').on(table.userId)
  ]
);

export type ArtifactDocument = InferSelectModel<typeof artifactDocuments>;
export type ArtifactDocumentInsert = InferInsertModel<typeof artifactDocuments>;

export const artifactSuggestions = sqliteTable(
  'artifact_suggestions',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    documentId: text('document_id').notNull(),
    documentCreatedAt: text('document_created_at').notNull(),
    originalText: text('original_text').notNull(),
    suggestedText: text('suggested_text').notNull(),
    description: text('description'),
    isResolved: int('is_resolved').default(0).notNull(),
    userId: text('user_id').notNull(),
    createdAt: text('created_at').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_artifact_suggestions_project'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [artifactDocuments.id],
      name: 'fk_artifact_suggestions_document'
    }).onDelete('cascade'),
    index('idx_artifact_suggestions_document_id').on(table.documentId),
    index('idx_artifact_suggestions_project_id').on(table.projectId),
    index('idx_artifact_suggestions_user_id').on(table.userId)
  ]
);

export type ArtifactSuggestion = InferSelectModel<typeof artifactSuggestions>;
export type ArtifactSuggestionInsert = InferInsertModel<typeof artifactSuggestions>;

export const playbooks = sqliteTable(
  'playbooks',
  {
    id: text().primaryKey(),
    projectId: text('project_id').notNull(),
    name: text('name', { length: 255 }).notNull(),
    description: text('description'),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
    createdBy: text('created_by').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'fk_playbooks_project'
    }).onDelete('cascade'),
    unique('uq_playbooks_name').on(table.projectId, table.name),
    index('idx_playbooks_project_id').on(table.projectId)
  ]
);

export type Playbook = InferSelectModel<typeof playbooks>;
export type PlaybookInsert = InferInsertModel<typeof playbooks>;

export const mcpServers = sqliteTable(
  'mcp_servers',
  {
    id: int().primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    serverName: text('server_name').notNull(),
    filePath: text('file_path').notNull(),
    version: text('version').notNull(),
    args: text('args'),
    env: text('env'),
    enabled: int('enabled').default(0).notNull(),
    createdAt: text('created_at').notNull()
  },
  (table) => [unique('uq_mcp_servers_name').on(table.name), unique('uq_mcp_servers_server_name').on(table.serverName)]
);

export type MCPServer = InferSelectModel<typeof mcpServers>;
export type MCPServerInsert = InferInsertModel<typeof mcpServers>;

export const customTools = sqliteTable('custom_tools', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  script: text('script').notNull(),
  createdAt: text('created_at').notNull()
});

export type CustomTool = InferSelectModel<typeof customTools>;
export type CustomToolInsert = InferInsertModel<typeof customTools>;
export type CloudProvider = string;
