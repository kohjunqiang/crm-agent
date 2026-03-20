import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Quotations table
  await db.schema
    .createTable('quotations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('deal_id', 'uuid', (col) => col.notNull().references('deals.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('quotation_number', 'text', (col) => col.notNull())
    .addColumn('items', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('subtotal', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('gst_rate', sql`numeric(5,4)`, (col) => col.notNull().defaultTo(0.09))
    .addColumn('gst_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('total', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('terms', 'text')
    .addColumn('validity_days', 'integer', (col) => col.defaultTo(30))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('pdf_path', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_quotations_deal ON quotations(deal_id)`.execute(db);

  // Invoices table
  await db.schema
    .createTable('invoices')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('deal_id', 'uuid', (col) => col.notNull().references('deals.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('invoice_number', 'text', (col) => col.notNull())
    .addColumn('items', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('gst_rate', sql`numeric(5,4)`, (col) => col.notNull().defaultTo(0.09))
    .addColumn('gst_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('total', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('due_date', 'date')
    .addColumn('payment_terms', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('pdf_path', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_invoices_deal ON invoices(deal_id)`.execute(db);

  // Receipts table
  await db.schema
    .createTable('receipts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('payment_id', 'uuid', (col) => col.notNull().references('payments.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('receipt_number', 'text', (col) => col.notNull())
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('pdf_path', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_receipts_payment ON receipts(payment_id)`.execute(db);

  // Document number sequences (per user, per type)
  await db.schema
    .createTable('document_sequences')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('type', 'text', (col) => col.notNull()) // 'quotation', 'invoice', 'receipt'
    .addColumn('last_number', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await sql`CREATE UNIQUE INDEX idx_doc_seq_user_type ON document_sequences(user_id, type)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('receipts').execute();
  await db.schema.dropTable('invoices').execute();
  await db.schema.dropTable('quotations').execute();
  await db.schema.dropTable('document_sequences').execute();
}
