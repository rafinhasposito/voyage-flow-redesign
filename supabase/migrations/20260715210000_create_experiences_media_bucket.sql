-- Migration: Create experiences-media bucket
-- This creates the Supabase Storage bucket for storing experience media files
-- It also applies the correct RLS policies for read/write access.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'experiences-media') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'experiences-media',
      'experiences-media',
      true,
      52428800, -- 50MB (max size allowed by bucket, handled specifically by frontend limits)
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
    );
  END IF;
END $$;

-- Policies for experiences-media bucket

-- 1. Permite leitura pública (qualquer usuário/anônimo pode ler)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public access to experiences-media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public access to experiences-media"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'experiences-media');
    END IF;
END $$;

-- 2. Permite escrita e exclusão somente por Admins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admin access to insert experiences-media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Admin access to insert experiences-media"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'experiences-media' AND 
            auth.role() = 'authenticated' AND 
            public.is_admin()
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admin access to update experiences-media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Admin access to update experiences-media"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'experiences-media' AND 
            auth.role() = 'authenticated' AND 
            public.is_admin()
        )
        WITH CHECK (
            bucket_id = 'experiences-media' AND 
            auth.role() = 'authenticated' AND 
            public.is_admin()
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admin access to delete experiences-media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Admin access to delete experiences-media"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'experiences-media' AND 
            auth.role() = 'authenticated' AND 
            public.is_admin()
        );
    END IF;
END $$;
