import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Contacts table
  await db.schema
    .createTable('contacts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('name', 'text')
    .addColumn('phone', 'text')
    .addColumn('telegram_chat_id', 'text')
    .addColumn('channel', 'text', (col) => col.notNull().check(sql`channel IN ('whatsapp', 'telegram')`))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('new').check(sql`status IN ('new', 'engaged', 'qualified', 'converted')`))
    .addColumn('agent_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('last_message_at', 'timestamptz')
    .addColumn('last_message_preview', 'text')
    .addColumn('metadata', 'jsonb', (col) => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_contacts_user_phone')
    .on('contacts')
    .columns(['user_id', 'phone'])
    .unique()
    .where(sql.ref('phone'), 'is not', null)
    .execute();

  await db.schema
    .createIndex('idx_contacts_user_telegram')
    .on('contacts')
    .columns(['user_id', 'telegram_chat_id'])
    .unique()
    .where(sql.ref('telegram_chat_id'), 'is not', null)
    .execute();

  await db.schema
    .createIndex('idx_contacts_user_last_msg')
    .on('contacts')
    .columns(['user_id', sql`last_message_at DESC`])
    .execute();

  // Messages table
  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('contact_id', 'uuid', (col) => col.notNull().references('contacts.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('direction', 'text', (col) => col.notNull().check(sql`direction IN ('inbound', 'outbound')`))
    .addColumn('sender', 'text', (col) => col.notNull().check(sql`sender IN ('lead', 'agent', 'human')`))
    .addColumn('channel', 'text', (col) => col.notNull().check(sql`channel IN ('whatsapp', 'telegram')`))
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('external_id', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_messages_contact_time')
    .on('messages')
    .columns(['contact_id', sql`created_at ASC`])
    .execute();

  await db.schema
    .createIndex('idx_messages_external')
    .on('messages')
    .columns(['external_id'])
    .unique()
    .where(sql.ref('external_id'), 'is not', null)
    .execute();

  // Enable realtime for messages
  await sql`ALTER PUBLICATION supabase_realtime ADD TABLE messages`.execute(db);

  // Knowledge base table
  await db.schema
    .createTable('knowledge_base')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_kb_user')
    .on('knowledge_base')
    .columns(['user_id'])
    .execute();

  // Agent config table (one per user)
  await db.schema
    .createTable('agent_config')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().unique().references('auth.users.id').onDelete('cascade'))
    .addColumn('system_prompt', 'text', (col) =>
      col.notNull().defaultTo('You are a helpful sales assistant. Answer questions based on the knowledge base provided. Be concise and friendly. If you do not know the answer, say so honestly.'))
    .addColumn('whatsapp_phone_id', 'text')
    .addColumn('whatsapp_token', 'text')
    .addColumn('whatsapp_verify_token', 'text')
    .addColumn('telegram_bot_token', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // updated_at trigger function
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);
  await sql`CREATE TRIGGER kb_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);
  await sql`CREATE TRIGGER agent_config_updated_at BEFORE UPDATE ON agent_config FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop triggers first
  await sql`DROP TRIGGER IF EXISTS agent_config_updated_at ON agent_config`.execute(db);
  await sql`DROP TRIGGER IF EXISTS kb_updated_at ON knowledge_base`.execute(db);
  await sql`DROP TRIGGER IF EXISTS contacts_updated_at ON contacts`.execute(db);
  await sql`DROP FUNCTION IF EXISTS update_updated_at()`.execute(db);

  // Remove from realtime publication
  await sql`ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS messages`.execute(db);

  // Drop tables in reverse dependency order
  await db.schema.dropTable('agent_config').ifExists().execute();
  await db.schema.dropTable('knowledge_base').ifExists().execute();
  await db.schema.dropTable('messages').ifExists().execute();
  await db.schema.dropTable('contacts').ifExists().execute();
}
