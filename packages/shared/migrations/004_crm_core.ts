import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add context and tags to contacts
  await db.schema
    .alterTable('contacts')
    .addColumn('context', 'jsonb', (col) => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('tags', sql`text[]`, (col) => col.defaultTo(sql`'{}'::text[]`))
    .execute();

  await sql`CREATE INDEX idx_contacts_tags ON contacts USING gin(tags)`.execute(db);

  // Deals table
  await db.schema
    .createTable('deals')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('contact_id', 'uuid', (col) => col.notNull().references('contacts.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('amount', sql`numeric(12,2)`)
    .addColumn('currency', 'text', (col) => col.defaultTo('SGD'))
    .addColumn('stage', 'text', (col) =>
      col.notNull().defaultTo('discovery').check(
        sql`stage IN ('discovery', 'consultation', 'quotation_sent', 'confirmed', 'ordered', 'fulfilled', 'completed', 'lost')`
      ))
    .addColumn('expected_close_date', 'date')
    .addColumn('products', 'jsonb', (col) => col.defaultTo(sql`'[]'::jsonb`))
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_deals_contact ON deals(contact_id)`.execute(db);
  await sql`CREATE INDEX idx_deals_user_stage ON deals(user_id, stage)`.execute(db);
  await sql`CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);

  // Payments table
  await db.schema
    .createTable('payments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('deal_id', 'uuid', (col) => col.notNull().references('deals.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('label', 'text')
    .addColumn('paid_at', 'timestamptz')
    .addColumn('receipt_issued_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_payments_deal ON payments(deal_id)`.execute(db);

  // Tasks table
  await db.schema
    .createTable('tasks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('contact_id', 'uuid', (col) => col.references('contacts.id').onDelete('set null'))
    .addColumn('deal_id', 'uuid', (col) => col.references('deals.id').onDelete('set null'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('due_date', 'timestamptz')
    .addColumn('status', 'text', (col) =>
      col.notNull().defaultTo('pending').check(sql`status IN ('pending', 'done')`))
    .addColumn('created_by', 'text', (col) =>
      col.notNull().defaultTo('human').check(sql`created_by IN ('human', 'agent')`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_tasks_user_status ON tasks(user_id, status)`.execute(db);
  await sql`CREATE INDEX idx_tasks_contact ON tasks(contact_id)`.execute(db);
  await sql`CREATE INDEX idx_tasks_deal ON tasks(deal_id)`.execute(db);
  await sql`CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);

  // Notes table
  await db.schema
    .createTable('notes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('contact_id', 'uuid', (col) => col.notNull().references('contacts.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('author', 'text', (col) =>
      col.notNull().defaultTo('human').check(sql`author IN ('human', 'agent')`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_notes_contact ON notes(contact_id)`.execute(db);

  // Activities table (audit log)
  await db.schema
    .createTable('activities')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('contact_id', 'uuid', (col) => col.references('contacts.id').onDelete('set null'))
    .addColumn('entity_type', 'text', (col) => col.notNull())
    .addColumn('entity_id', 'uuid')
    .addColumn('event_type', 'text', (col) => col.notNull())
    .addColumn('actor', 'text', (col) =>
      col.notNull().defaultTo('human').check(sql`actor IN ('human', 'agent', 'system')`))
    .addColumn('metadata', 'jsonb', (col) => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_activities_user_time ON activities(user_id, created_at DESC)`.execute(db);
  await sql`CREATE INDEX idx_activities_contact ON activities(contact_id, created_at DESC)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse dependency order
  await db.schema.dropTable('activities').ifExists().execute();
  await db.schema.dropTable('notes').ifExists().execute();

  // Drop triggers before tables
  await sql`DROP TRIGGER IF EXISTS tasks_updated_at ON tasks`.execute(db);
  await db.schema.dropTable('tasks').ifExists().execute();

  await db.schema.dropTable('payments').ifExists().execute();

  await sql`DROP TRIGGER IF EXISTS deals_updated_at ON deals`.execute(db);
  await db.schema.dropTable('deals').ifExists().execute();

  // Remove columns from contacts
  await sql`DROP INDEX IF EXISTS idx_contacts_tags`.execute(db);
  await db.schema
    .alterTable('contacts')
    .dropColumn('context')
    .dropColumn('tags')
    .execute();
}
