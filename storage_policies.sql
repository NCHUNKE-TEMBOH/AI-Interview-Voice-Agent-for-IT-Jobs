-- =====================================================
-- STORAGE BUCKET POLICIES FOR CV UPLOADS
-- =====================================================

-- 1. Allow authenticated users to upload their own CVs
CREATE POLICY "Users can upload their own CVs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'cv-uploads' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 2. Allow users to view their own CVs
CREATE POLICY "Users can view their own CVs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'cv-uploads' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Allow users to delete their own CVs
CREATE POLICY "Users can delete their own CVs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'cv-uploads' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 4. Allow companies to view CVs of job applicants
CREATE POLICY "Companies can view applicant CVs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'cv-uploads' AND
        auth.role() = 'authenticated'
    );

-- 5. Allow companies to delete CVs (for moderation)
CREATE POLICY "Companies can delete CVs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'cv-uploads' AND
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM "Companies" 
            WHERE email = auth.jwt() ->> 'email'
        )
    );
