import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create the documents storage bucket
  await sql`
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false)
    ON CONFLICT (id) DO NOTHING
  `.execute(db);

  // Allow authenticated users to upload to their own folder
  await sql`
    CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'documents'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  `.execute(db);

  // Allow authenticated users to read their own documents
  await sql`
    CREATE POLICY "Users can read own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'documents'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  `.execute(db);

  // Allow authenticated users to update their own documents (for upsert)
  await sql`
    CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'documents'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects`.execute(db);
  await sql`DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects`.execute(db);
  await sql`DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects`.execute(db);
  await sql`DELETE FROM storage.buckets WHERE id = 'documents'`.execute(db);
}
