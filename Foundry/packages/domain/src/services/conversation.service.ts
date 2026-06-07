import type { IConversationRepository, CreateConversationInput } from "../repositories/conversation.repository";
import type { Conversation } from "@foundry/shared";
import { ValidationError } from "../errors";

export interface ConversationServiceDeps {
  conversationRepo: IConversationRepository;
}

export function createConversationService(deps: ConversationServiceDeps) {
  async function list(taskId: string): Promise<Conversation[]> {
    return deps.conversationRepo.list(taskId);
  }

  async function create(input: CreateConversationInput): Promise<Conversation> {
    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError("Conversation content is required");
    }
    if (!input.source || input.source.trim().length === 0) {
      throw new ValidationError("Conversation source is required");
    }
    if (!input.author || input.author.trim().length === 0) {
      throw new ValidationError("Conversation author is required");
    }
    return deps.conversationRepo.create(input);
  }

  return { list, create };
}

export type ConversationService = ReturnType<typeof createConversationService>;
