import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductManager } from '@/components/admin/product-manager'

export default async function ProductsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/admin')

  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        compare_at_price,
        material,
        short_description,
        description,
        status,
        category_id,
        created_at,
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
          price_override,
          is_active
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, is_active')
      .order('sort_order', { ascending: true })
  ])

  if (error) {
    throw new Error(`No se pudo cargar el catálogo: ${error.message}`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbaszjtjhzgrarkbhvt.supabase.co'

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand brand-logo admin-brand-logo" href="/admin">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link className="pill" href="/admin">
            ← Volver al panel
          </Link>
          <Link className="pill" href="/" target="_blank">
            Ver tienda ↗
          </Link>
        </div>
      </header>

      <section className="admin-content admin-content-wide">
        <div className="eyebrow">MAISON ERIKA STUDIO</div>
        <h1>Catálogo de Productos</h1>
        <p>Administra las piezas, existencias, precios, variantes y fotografías de tu boutique.</p>

        <ProductManager
          products={(products ?? []) as any[]}
          categories={categories ?? []}
          supabaseUrl={supabaseUrl}
        />
      </section>
    </main>
  )
}
