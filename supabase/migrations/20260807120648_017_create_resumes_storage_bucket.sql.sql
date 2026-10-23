/*
# Create resumes storage bucket

1. Storage
- Create a private storage bucket named "resumes" for candidate resume files (.pdf, .doc, .docx)
- Bucket is private (not publicly accessible) to protect candidate data

2. Security (RLS on storage.objects)
- Authenticated users can upload, read, update, and delete only their own resume files
- Ownership is enforced via the `owner` column on storage.objects which stores auth.uid()
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resume_upload_own" ON storage.objects;
CREATE POLICY "resume_upload_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'resumes' AND owner = auth.uid());

DROP POLICY IF EXISTS "resume_read_own" ON storage.objects;
CREATE POLICY "resume_read_own" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'resumes' AND owner = auth.uid());

DROP POLICY IF EXISTS "resume_update_own" ON storage.objects;
CREATE POLICY "resume_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'resumes' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'resumes' AND owner = auth.uid());

DROP POLICY IF EXISTS "resume_delete_own" ON storage.objects;
CREATE POLICY "resume_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'resumes' AND owner = auth.uid());