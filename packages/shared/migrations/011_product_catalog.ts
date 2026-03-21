import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Product categories
  await db.schema
    .createTable('product_categories')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE UNIQUE INDEX idx_product_categories_user_name ON product_categories(user_id, name)`.execute(db);

  // Products
  await db.schema
    .createTable('products')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('category_id', 'uuid', (col) => col.references('product_categories.id').onDelete('set null'))
    .addColumn('sell_price', sql`numeric(12,2)`)
    .addColumn('cost_price', sql`numeric(12,2)`)
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_products_user ON products(user_id)`.execute(db);
  await sql`CREATE INDEX idx_products_category ON products(category_id)`.execute(db);
  await sql`CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);

  // Product variants
  await db.schema
    .createTable('product_variants')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('product_id', 'uuid', (col) => col.notNull().references('products.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users.id').onDelete('cascade'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('attributes', 'jsonb', (col) => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('sell_price', sql`numeric(12,2)`)
    .addColumn('cost_price', sql`numeric(12,2)`)
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`CREATE INDEX idx_product_variants_product ON product_variants(product_id)`.execute(db);
  await sql`CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at()`.execute(db);

  // RLS
  await sql`ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`ALTER TABLE products ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY`.execute(db);

  await sql`CREATE POLICY product_categories_user ON product_categories FOR ALL USING (user_id = auth.uid())`.execute(db);
  await sql`CREATE POLICY products_user ON products FOR ALL USING (user_id = auth.uid())`.execute(db);
  await sql`CREATE POLICY product_variants_user ON product_variants FOR ALL USING (user_id = auth.uid())`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS product_variants_updated_at ON product_variants`.execute(db);
  await db.schema.dropTable('product_variants').ifExists().execute();
  await sql`DROP TRIGGER IF EXISTS products_updated_at ON products`.execute(db);
  await db.schema.dropTable('products').ifExists().execute();
  await db.schema.dropTable('product_categories').ifExists().execute();
}
