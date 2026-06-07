import type { Setting } from "@foundry/shared";
import type { Queryable } from "../connection";

export class SettingRepository {
  constructor(private pool: Queryable) {}

  async get(key: string): Promise<string | null> {
    const { rows } = await this.pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = $1",
      [key]
    );
    return rows[0]?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
      [key, value]
    );
  }

  async getAll(): Promise<Setting[]> {
    const { rows } = await this.pool.query<Setting>(
      "SELECT * FROM settings"
    );
    return rows;
  }
}
