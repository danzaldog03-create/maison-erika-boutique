-- ============================================================================
-- MAISON ERIKA — ACTUALIZACIÓN DE CAMPOS DE HERO EDITORIAL
-- Archivo: supabase/pending/20261108_hero_settings_update.sql
-- ============================================================================
-- Agrega columnas para el Hero editorial multimedia en store_settings
-- (100% no destructivo e idempotente)
-- ============================================================================

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_is_active BOOLEAN DEFAULT true;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_media_type TEXT DEFAULT 'image';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_image_path TEXT DEFAULT '/hero/editorial-jewelry-hero.jpg';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_video_path TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_video_poster_path TEXT DEFAULT '/hero/editorial-poster.jpg';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_button_text TEXT DEFAULT 'Descubrir colección';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_button_url TEXT DEFAULT '#productos';
