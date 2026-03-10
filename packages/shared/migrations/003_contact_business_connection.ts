import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('contacts')
    .addColumn('telegram_business_connection_id', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('contacts')
    .dropColumn('telegram_business_connection_id')
    .execute();
}
