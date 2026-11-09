-- ============================================================================
-- MAISON ERIKA — PERMISOS DE ALMACENAMIENTO (SUPABASE STORAGE)
-- Archivo: supabase/pending/20261108_storage_product_media_policies.sql
-- ============================================================================
-- Resuelve el error:
-- "new row violates row-level security policy"
-- al subir fotografías y videos en el panel de administración.
-- ============================================================================

-- 1. Crear el bucket 'product-media' si no existe y asegurar que sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpiar políticas previas para evitar duplicados
DROP POLICY IF EXISTS "product_media_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_media_update" ON storage.objects;
DROP POLICY IF EXISTS "product_media_delete" ON storage.objects;

-- 4. Permitir lectura pública de imágenes y videos (para que se vean en la tienda)
CREATE POLICY "product_media_public_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-media');

-- 5. Permitir subir archivos al bucket 'product-media'
CREATE POLICY "product_media_insert"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-media');

-- 6. Permitir sobrescribir o actualizar archivos
CREATE POLICY "product_media_update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'product-media');

-- 7. Permitir eliminar archivos del bucket
CREATE POLICY "product_media_delete"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'product-media');
