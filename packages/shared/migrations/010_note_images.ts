import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE notes
    ADD COLUMN image_urls text[] NOT NULL DEFAULT '{}'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE notes
    DROP COLUMN IF EXISTS image_urls
  `.execute(db);
}
