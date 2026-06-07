import type { IConversationRepository, CreateConversationInput } from "@foundry/domain";
import type { Conversation } from "@foundry/shared";
import { generateId } from "@foundry/shared";
import type { Queryable } from "../connection";

interface ConversationRow {
  id: string;
  task_id: string;
  source: string;
  author: string;
  content: string;
  external_id: string | null;
  external_url: string | null;
  created_at: string;
}

function mapRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    taskId: row.task_id,
    source: row.source,
    author: row.author,
    content: row.content,
    externalId: row.external_id,
    externalUrl: row.external_url,
    createdAt: row.created_at,
  };
}

export class ConversationRepository implements IConversationRepository {
  constructor(private pool: Queryable) {}

  private now(): string {
    return new Date().toISOString();
  }

  async list(taskId: string): Promise<Conversation[]> {
    const { rows } = await this.pool.query<ConversationRow>(
      "SELECT * FROM conversations WHERE task_id = $1 ORDER BY created_at ASC",
      [taskId]
    );
    return rows.map(mapRow);
  }

  async create(input: CreateConversationInput): Promise<Conversation> {
    const id = generateId.conversation();
    const timestamp = input.createdAt ?? this.now();

    await this.pool.query(
      "INSERT INTO conversations (id, task_id, source, author, content, external_id, external_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        id,
        input.taskId,
        input.source.trim(),
        input.author.trim(),
        input.content.trim(),
        input.externalId ?? null,
        input.externalUrl ?? null,
        timestamp,
      ]
    );

    const { rows } = await this.pool.query<ConversationRow>(
      "SELECT * FROM conversations WHERE id = $1",
      [id]
    );
    return mapRow(rows[0]);
  }
}
