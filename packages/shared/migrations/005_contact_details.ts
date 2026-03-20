import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('contacts')
    .addColumn('email', 'text')
    .addColumn('address', 'text')
    .addColumn('company', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('contacts')
    .dropColumn('email')
    .dropColumn('address')
    .dropColumn('company')
    .execute();
}
