-- ============================================================================
-- MAISON ERIKA — ESQUEMA COMPLETO DE COMERCIO ELECTRÓNICO (VERSIÓN ROBUSTA)
-- Archivo: supabase/pending/20261108_ecommerce_full_schema.sql
-- ============================================================================
-- IMPORTANTE ANTES DE PEGAR EN SUPABASE:
-- Desactiva la traducción automática del navegador (Google Traductor) en
-- la pestaña de Supabase. Si está activada, el navegador traduce palabras clave
-- de SQL como "COMMIT;" a "COMPROMETERSE ;" o "CREATE POLICY" a "CREAR POLÍTICA",
-- provocando errores de sintaxis en PostgreSQL.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIÓN Y FUNCIÓN DE SEGURIDAD
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. TABLA: store_settings (Configuración de la tienda)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default'
);

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '524490000000';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT '¡Hola! Me gustaría información sobre un pedido en Maison Erika.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'BBVA México';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_beneficiary TEXT DEFAULT 'Maison Erika / Erika Martínez';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_clabe TEXT DEFAULT '012180000000000000';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_account TEXT DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_instructions TEXT DEFAULT 'Realiza tu transferencia usando tu número de pedido como concepto o referencia. Envíanos tu comprobante por WhatsApp para validar tu compra.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS shipping_flat_rate NUMERIC(10,2) DEFAULT 150.00;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2) DEFAULT 999.00;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS shipping_estimated_days TEXT DEFAULT '3 a 5 días hábiles';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com/maisonerika';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT 'https://facebook.com/maisonerika';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT 'https://tiktok.com/@maisonerika';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS announcement_text TEXT DEFAULT 'UN DETALLE BONITO PUEDE CAMBIAR TODO · ENVÍOS A TODO MÉXICO';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_eyebrow TEXT DEFAULT 'A LITTLE WORLD OF BEAUTY';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Pequeños tesoros, grandes detalles.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Accesorios para acompañarte, hacerte brillar y convertir cualquier día en una ocasión especial.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_is_active BOOLEAN DEFAULT true;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_media_type TEXT DEFAULT 'image';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_image_path TEXT DEFAULT '/hero/editorial-jewelry-hero.jpg';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_video_path TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_video_poster_path TEXT DEFAULT '/hero/editorial-poster.jpg';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_button_text TEXT DEFAULT 'Descubrir colección';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_button_url TEXT DEFAULT '#productos';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS shop_looks JSONB;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS story_title TEXT DEFAULT 'La belleza está en los detalles.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS story_content TEXT DEFAULT 'Maison Erika nace en Aguascalientes, México, con la ilusión de convertir los pequeños detalles en momentos especiales. Creemos que los accesorios son mucho más que un complemento: son una expresión de personalidad, elegancia y estilo propio. Seleccionamos piezas pensadas para acompañarte en cada ocasión, desde los días cotidianos hasta esos momentos que merecen brillar.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'hola@maisonerika.mx';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

INSERT INTO public.store_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. TABLA: orders (Cabecera de pedidos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Restricción única en order_number si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_key'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Índices de consulta rápida en orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ----------------------------------------------------------------------------
-- 4. TABLA: order_items (Detalle de productos comprados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT 'Única';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ----------------------------------------------------------------------------
-- 5. COMPATIBILIDAD DE COLUMNAS EN TABLAS EXISTENTES
-- ----------------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS price_override NUMERIC(10,2);
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 6. CATEGORÍA 'ROPA': Asegurar que exista y esté OCULTA (is_active = false)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES ('Ropa', 'ropa', 'Colección exclusiva de prendas Maison Erika (Lanzamiento especial).', false, 99)
ON CONFLICT (slug) DO UPDATE
SET is_active = false
WHERE public.categories.slug = 'ropa';

-- ----------------------------------------------------------------------------
-- 7. POLÍTICAS DE SEGURIDAD (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- store_settings
DROP POLICY IF EXISTS store_settings_read_public ON public.store_settings;
CREATE POLICY store_settings_read_public ON public.store_settings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS store_settings_write_admin ON public.store_settings;
CREATE POLICY store_settings_write_admin ON public.store_settings
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- orders
DROP POLICY IF EXISTS orders_select_admin ON public.orders;
CREATE POLICY orders_select_admin ON public.orders
  FOR SELECT TO authenticated
  USING (private.is_admin());

DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS orders_insert_checkout ON public.orders;
CREATE POLICY orders_insert_checkout ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS orders_update_admin ON public.orders;
CREATE POLICY orders_update_admin ON public.orders
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS orders_delete_admin ON public.orders;
CREATE POLICY orders_delete_admin ON public.orders
  FOR DELETE TO authenticated
  USING (private.is_admin());

-- order_items
DROP POLICY IF EXISTS order_items_select_admin ON public.order_items;
CREATE POLICY order_items_select_admin ON public.order_items
  FOR SELECT TO authenticated
  USING (private.is_admin());

DROP POLICY IF EXISTS order_items_select_own ON public.order_items;
CREATE POLICY order_items_select_own ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS order_items_insert_checkout ON public.order_items;
CREATE POLICY order_items_insert_checkout ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- categories
DROP POLICY IF EXISTS categories_select_active ON public.categories;
CREATE POLICY categories_select_active ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR private.is_admin());

DROP POLICY IF EXISTS categories_write_admin ON public.categories;
CREATE POLICY categories_write_admin ON public.categories
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- products
DROP POLICY IF EXISTS products_select_active ON public.products;
CREATE POLICY products_select_active ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR private.is_admin());

DROP POLICY IF EXISTS products_write_admin ON public.products;
CREATE POLICY products_write_admin ON public.products
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- product_variants
DROP POLICY IF EXISTS product_variants_select ON public.product_variants;
CREATE POLICY product_variants_select ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR private.is_admin());

DROP POLICY IF EXISTS product_variants_write_admin ON public.product_variants;
CREATE POLICY product_variants_write_admin ON public.product_variants
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- product_images
DROP POLICY IF EXISTS product_images_select ON public.product_images;
CREATE POLICY product_images_select ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS product_images_write_admin ON public.product_images;
CREATE POLICY product_images_write_admin ON public.product_images
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- inventory_movements
DROP POLICY IF EXISTS inventory_movements_admin_all ON public.inventory_movements;
CREATE POLICY inventory_movements_admin_all ON public.inventory_movements
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ----------------------------------------------------------------------------
-- 8. STORAGE (Políticas para subir fotografías y videos al bucket product-media)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "product_media_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_media_update" ON storage.objects;
DROP POLICY IF EXISTS "product_media_delete" ON storage.objects;

CREATE POLICY "product_media_public_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-media');

CREATE POLICY "product_media_insert"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "product_media_update"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'product-media');

CREATE POLICY "product_media_delete"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'product-media');

COMMIT;
