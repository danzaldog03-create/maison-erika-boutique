-- ============================================================================
-- MAISON ERIKA — AGREGAR COLUMNA shop_looks A store_settings
-- ============================================================================
-- Resuelve el error:
-- "Could not find the 'shop_looks' column of 'store_settings' in the schema cache"
-- ============================================================================

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS shop_looks JSONB;

-- Recargar la caché de PostgREST en Supabase
NOTIFY pgrst, 'reload schema';
