import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CartButton } from '@/components/cart/cart-button'
import { BrandLogo } from '@/components/navigation/brand-logo'
import { EditorialHero } from '@/components/store/editorial-hero'
import { ShopTheLook } from '@/components/store/shop-the-look'
import { ProductCatalog, CatalogProduct, CatalogCategory } from '@/components/store/product-catalog'
import { getStoreSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const supabase = await createClient()
  const settings = await getStoreSettings()

  const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
    supabase
      .from('categories')
      .select('id,name,slug')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        sku,
        short_description,
        description,
        material,
        price,
        compare_at_price,
        is_featured,
        is_new,
        category_id,
        product_images (
          storage_path,
          alt_text,
          is_primary,
          sort_order
        ),
        product_variants (
          id,
          name,
          stock_quantity,
          is_active
        )
      `)
      .eq('status', 'active')
      .order('published_at', { ascending: false })
  ])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbaszjtjhzgrarkbhvt.supabase.co'

  // Map category names to lookup table
  const categoryMap = new Map<string, string>()
  const categories: CatalogCategory[] = (categoriesData ?? []).map((c) => {
    categoryMap.set(c.id, c.name)
    return {
      id: c.id,
      name: c.name,
      slug: c.slug
    }
  })

  // Format products with accurate stock from active variants
  const products: CatalogProduct[] = (productsData ?? []).map((p: any) => {
    const activeVariants = (p.product_variants ?? []).filter((v: any) => v.is_active !== false)
    const totalStock = activeVariants.reduce((sum: number, v: any) => sum + (v.stock_quantity ?? 0), 0)
    const primaryVariant = activeVariants[0]

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      short_description: p.short_description,
      description: p.description,
      material: p.material,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      sku: p.sku,
      is_featured: Boolean(p.is_featured),
      is_new: Boolean(p.is_new),
      category_id: p.category_id,
      category_name: categoryMap.get(p.category_id) ?? 'Colección',
      total_stock: totalStock,
      primary_variant_id: primaryVariant?.id ?? p.id,
      images: (p.product_images ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
  })

  return (
    <main>
      {/* Announcement Bar */}
      <div className="announcement">{settings.announcement_text}</div>

      {/* Main Navigation Topbar (Pristine Luxury Storefront) */}
      <header className="topbar">
        <nav aria-label="Navegación principal">
          <a href="#colecciones">COLECCIONES</a>
          <a href="#productos">SHOP</a>
          <a href="#historia">HISTORIA</a>
          <a href="#social">INSPIRACIÓN</a>
        </nav>

        {/* Official Transparent Logo with secret 3-click Admin Access */}
        <BrandLogo />

        <div className="actions">
          <CartButton />
        </div>
      </header>

      {/* Editorial Hero Section (Photo or Looping MP4 Video) */}
      <EditorialHero
        settings={settings}
        supabaseUrl={supabaseUrl}
      />

      {/* Featured Collections Section */}
      <section className="section" id="colecciones">
        <div className="section-head">
          <div className="editorial-section-eyebrow">CURATED COLLECTIONS</div>
          <h2>Un universo de detalles</h2>
          <p>Piezas especiales diseñadas para acompañarte en cada momento.</p>
        </div>

        <div className="categories">
          {categories.map((c, i) => (
            <a className={`category cat-${i % 3}`} href="#productos" key={c.id}>
              <div className="category-meta">
                <span className="category-tag">Colección</span>
                <span className="category-name">{c.name} ↗</span>
              </div>
            </a>
          ))}
          {!categories.length && (
            <div className="empty-editorial-card">
              <span className="placeholder">✧</span>
              <h3>Nuevas colecciones en preparación</h3>
              <p>Pronto descubrirás nuestras primeras selecciones exclusivas ♡</p>
            </div>
          )}
        </div>
      </section>

      {/* Products & Interactive Catalog Section */}
      <section className="section" id="productos">
        <div className="section-head">
          <div className="editorial-section-eyebrow">THE LITTLE THINGS · PIEZAS DE AUTOR</div>
          <h2>Favoritos de la boutique</h2>
          <p>Encuentra esa joya o accesorio que resuena con tu esencia.</p>
        </div>

        <ProductCatalog
          products={products}
          categories={categories}
          supabaseUrl={supabaseUrl}
        />
      </section>

      {/* Brand Story Section */}
      <section className="story" id="historia">
        <div className="story-container">
          <div className="story-quote-symbol">“</div>
          <div className="editorial-section-eyebrow">A NOTE FROM ERIKA · AGUASCALIENTES, MÉXICO</div>
          <h2>{settings.story_title}</h2>
          <p>{settings.story_content}</p>
          <div className="origin-line">Desde Aguascalientes, con amor.</div>
          <div className="signature">Con cariño, Erika Martínez ♡</div>
        </div>
      </section>

      {/* Shop the Look / Video Reels & Galería de Estilo */}
      <ShopTheLook
        looks={settings.shop_looks}
        instagramUrl={settings.instagram_url}
        whatsappNumber={settings.whatsapp_number}
        supabaseUrl={supabaseUrl}
      />

      {/* Newsletter / Personal Concierge Contact */}
      <section className="newsletter">
        <div className="newsletter-box">
          <span className="newsletter-sparkle">✧</span>
          <h2>Asesoría &amp; Dudas Personalizadas</h2>
          <p>¿Buscas una recomendación para un regalo especial o necesitas información de existencias? Escríbenos directamente.</p>
          <a
            className="primary"
            href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            ESCRIBIR POR WHATSAPP ↗
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/maison-erika-logo-transparent.png" alt="Logotipo de Maison Erika" />
          <p>Pequeños tesoros, grandes detalles.</p>
          <p className="footer-origin">
            Desde Aguascalientes, con amor.<br />
            Una boutique nacida en el corazón de México, inspirada en la belleza de los pequeños detalles.
          </p>
          <span className="footer-location">AGUASCALIENTES · MÉXICO</span>
        </div>
        <div>
          <h4>EXPLORA</h4>
          <a href="#colecciones">Colecciones</a>
          <a href="#productos">Todos los productos</a>
          <Link href="/carrito">Bolsa de compra</Link>
          <a href="#historia">Nuestra historia</a>
        </div>
        <div>
          <h4>ATENCIÓN PERSONALIZADA</h4>
          <a href={`mailto:${settings.contact_email}`}>Correo: {settings.contact_email}</a>
          <a
            href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp Comercial
          </a>
          {settings.instagram_url && (
            <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          {settings.facebook_url && (
            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          )}
        </div>
      </footer>

      {/* Copyright with Secret Admin Micro-Link on the Heart Icon ♡ */}
      <div className="copyright">
        © {new Date().getFullYear()} MAISON ERIKA · HECHO CON AMOR{' '}
        <Link
          href="/admin"
          className="secret-admin-heart"
          title="Acceso administrativo"
          aria-label="Acceso"
        >
          ♡
        </Link>
      </div>
    </main>
  )
}
