import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CartButton } from '@/components/cart/cart-button'
import { ProductDetailView, ProductDetailData } from '@/components/store/product-detail-view'
import { getStoreSettings } from '@/lib/settings'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const settings = await getStoreSettings()

  const { data: product } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      sku,
      material,
      short_description,
      description,
      price,
      compare_at_price,
      status,
      category_id,
      product_images (
        id,
        storage_path,
        alt_text,
        is_primary,
        sort_order
      ),
      product_variants (
        id,
        name,
        sku,
        stock_quantity,
        is_active,
        price_override
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!product) notFound()

  const { data: category } = await supabase
    .from('categories')
    .select('name, is_active')
    .eq('id', product.category_id)
    .maybeSingle()

  if (!category || !category.is_active) notFound()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbaszjtjhzgrarkbhvt.supabase.co'

  const productData: ProductDetailData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    material: product.material,
    short_description: product.short_description,
    description: product.description,
    price: Number(product.price),
    compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
    category_name: category.name,
    images: (product.product_images ?? []).sort(
      (a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
    variants: product.product_variants ?? []
  }

  return (
    <main className="product-detail-page">
      <div className="announcement">{settings.announcement_text}</div>

      <header className="topbar">
        <Link className="pill" href="/">
          ← VOLVER A LA BOUTIQUE
        </Link>
        <Link className="brand brand-logo" href="/" aria-label="Maison Erika, inicio">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div className="actions">
          <CartButton />
        </div>
      </header>

      <ProductDetailView
        product={productData}
        supabaseUrl={supabaseUrl}
        whatsappNumber={settings.whatsapp_number}
      />

      <footer className="footer">
        <div className="footer-brand">
          <img src="/maison-erika-logo-transparent.png" alt="Logotipo de Maison Erika" />
          <p>Pequeños tesoros, grandes detalles.</p>
          <span className="footer-location">AGUASCALIENTES · MÉXICO</span>
        </div>
        <div>
          <h4>EXPLORA</h4>
          <Link href="/">Inicio</Link>
          <Link href="/#colecciones">Colecciones</Link>
          <Link href="/carrito">Bolsa de compra</Link>
        </div>
        <div>
          <h4>ATENCIÓN</h4>
          <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
          <a
            href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp Comercial
          </a>
        </div>
      </footer>

      <div className="copyright">© {new Date().getFullYear()} MAISON ERIKA · HECHO CON AMOR ♡</div>
    </main>
  )
}
