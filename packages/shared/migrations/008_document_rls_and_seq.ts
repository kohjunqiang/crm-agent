import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // --- RLS policies for document tables ---

  // Quotations
  await sql`ALTER TABLE quotations ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`CREATE POLICY "Users can manage own quotations" ON quotations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.execute(db);

  // Invoices
  await sql`ALTER TABLE invoices ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.execute(db);

  // Receipts
  await sql`ALTER TABLE receipts ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`CREATE POLICY "Users can manage own receipts" ON receipts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.execute(db);

  // Document sequences
  await sql`ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`CREATE POLICY "Users can manage own sequences" ON document_sequences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.execute(db);

  // --- Atomic document number function ---
  await sql`
    CREATE OR REPLACE FUNCTION next_doc_number(p_user_id uuid, p_type text)
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_next integer;
    BEGIN
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
  await sql`DROP FUNCTION IF EXISTS next_doc_number`.execute(db);

  await sql`DROP POLICY IF EXISTS "Users can manage own sequences" ON document_sequences`.execute(db);
  await sql`ALTER TABLE document_sequences DISABLE ROW LEVEL SECURITY`.execute(db);

  await sql`DROP POLICY IF EXISTS "Users can manage own receipts" ON receipts`.execute(db);
  await sql`ALTER TABLE receipts DISABLE ROW LEVEL SECURITY`.execute(db);

  await sql`DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices`.execute(db);
  await sql`ALTER TABLE invoices DISABLE ROW LEVEL SECURITY`.execute(db);

  await sql`DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations`.execute(db);
  await sql`ALTER TABLE quotations DISABLE ROW LEVEL SECURITY`.execute(db);
}
