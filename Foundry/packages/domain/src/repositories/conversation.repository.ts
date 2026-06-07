import type { Conversation } from "@foundry/shared";

export interface CreateConversationInput {
  taskId: string;
  source: string;
  author: string;
  content: string;
  externalId?: string;
  externalUrl?: string;
  createdAt?: string;
}

export interface IConversationRepository {
  list(taskId: string): Promise<Conversation[]>;
  create(input: CreateConversationInput): Promise<Conversation>;
}
