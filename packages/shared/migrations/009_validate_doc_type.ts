import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
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
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert to version without validation
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
