-- Apply after Storage has completed its schema migrations.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('resumes', 'resumes', false, 5242880)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS resume_upload_own ON storage.objects;
CREATE POLICY resume_upload_own ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS resume_read_own ON storage.objects;
CREATE POLICY resume_read_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND coalesce(owner_id, owner::text) = auth.uid()::text);

DROP POLICY IF EXISTS resume_update_own ON storage.objects;
CREATE POLICY resume_update_own ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND coalesce(owner_id, owner::text) = auth.uid()::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
AND coalesce(owner_id, owner::text) = auth.uid()::text);

DROP POLICY IF EXISTS resume_delete_own ON storage.objects;
CREATE POLICY resume_delete_own ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND coalesce(owner_id, owner::text) = auth.uid()::text);
