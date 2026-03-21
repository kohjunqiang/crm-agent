import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Order stages (user-customizable fulfillment stages)
  await db.schema
    .createTable('order_stages')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('color', 'text', (col) => col.notNull().defaultTo('#f59e0b'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE UNIQUE INDEX idx_order_stages_user_name ON order_stages(user_id, name)`.execute(db);

  // Orders
  await db.schema
    .createTable('orders')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('deal_id', 'uuid', (col) => col.notNull().references('deals.id').onDelete('cascade'))
    .addColumn('contact_id', 'uuid', (col) => col.notNull().references('contacts.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('order_number', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('stage', 'text', (col) => col.notNull())
    .addColumn('total_amount', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(0))
    .addColumn('notes', 'text')
    .addColumn('delivery_address', 'text')
    .addColumn('delivery_date', 'date')
    .addColumn('delivery_notes', 'text')
    .addColumn('assigned_to', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE UNIQUE INDEX idx_orders_deal ON orders(deal_id)`.execute(db);
  await sql`CREATE INDEX idx_orders_user ON orders(user_id)`.execute(db);
  await sql`CREATE INDEX idx_orders_contact ON orders(contact_id)`.execute(db);
  await sql`CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);

  // Order items (immutable snapshots of deal line items)
  await db.schema
    .createTable('order_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('cascade'))
    .addColumn('product_id', 'uuid', (col) => col.references('products.id').onDelete('set null'))
    .addColumn('product_variant_id', 'uuid', (col) => col.references('product_variants.id').onDelete('set null'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('qty', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('unit_price', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(0))
    .addColumn('width_cm', sql`numeric(8,2)`)
    .addColumn('drop_cm', sql`numeric(8,2)`)
    .addColumn('room_name', 'text')
    .addColumn('window_position', 'text')
    .addColumn('fixing_type', 'text')
    .addColumn('stack_direction', 'text')
    .addColumn('lining_type', 'text')
    .addColumn('motorization', 'text')
    .addColumn('notes', 'text')
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_order_items_order ON order_items(order_id)`.execute(db);

  // Order stage history (audit log)
  await db.schema
    .createTable('order_stage_history')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('cascade'))
    .addColumn('from_stage', 'text')
    .addColumn('to_stage', 'text', (col) => col.notNull())
    .addColumn('changed_by', 'uuid', (col) => col.references('auth.users.id'))
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_order_stage_history_order ON order_stage_history(order_id)`.execute(db);

  // RLS
  await sql`ALTER TABLE order_stages ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`ALTER TABLE orders ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`ALTER TABLE order_items ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`ALTER TABLE order_stage_history ENABLE ROW LEVEL SECURITY`.execute(db);

  await sql`CREATE POLICY order_stages_user ON order_stages FOR ALL USING (user_id = auth.uid())`.execute(db);
  await sql`CREATE POLICY orders_user ON orders FOR ALL USING (user_id = auth.uid())`.execute(db);
  await sql`CREATE POLICY order_items_user ON order_items FOR ALL USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()))`.execute(db);
  await sql`CREATE POLICY order_stage_history_user ON order_stage_history FOR ALL USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_stage_history.order_id AND orders.user_id = auth.uid()))`.execute(db);

  // Add 'order' to the next_doc_number RPC whitelist
  await sql`
    CREATE OR REPLACE FUNCTION next_doc_number(p_user_id uuid, p_type text)
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_next integer;
    BEGIN
      IF p_type NOT IN ('quotation', 'invoice', 'receipt', 'order') THEN
        RAISE EXCEPTION 'Invalid document type: %', p_type;
      END IF;

      INSERT INTO document_sequences (user_id, type, last_number)
      VALUES (p_user_id, p_type, 1)
      ON CONFLICT (user_id, type)
      DO UPDATE SET last_number = document_sequences.last_number + 1
      RETURNING last_number INTO v_next;
      RETURN v_next;
    END;
    $$
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore next_doc_number without 'order' type
  await sql`
    CREATE OR REPLACE FUNCTION next_doc_number(p_user_id uuid, p_type text)
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_next integer;
    BEGIN
      IF p_type NOT IN ('quotation', 'invoice', 'receipt') THEN
        RAISE EXCEPTION 'Invalid document type: %', p_type;
      END IF;

      INSERT INTO document_sequences (user_id, type, last_number)
      VALUES (p_user_id, p_type, 1)
      ON CONFLICT (user_id, type)
      DO UPDATE SET last_number = document_sequences.last_number + 1
      RETURNING last_number INTO v_next;
      RETURN v_next;
    END;
    $$
  `.execute(db);

  await db.schema.dropTable('order_stage_history').ifExists().execute();
  await db.schema.dropTable('order_items').ifExists().execute();
  await sql`DROP TRIGGER IF EXISTS orders_updated_at ON orders`.execute(db);
  await db.schema.dropTable('orders').ifExists().execute();
  await db.schema.dropTable('order_stages').ifExists().execute();
}
