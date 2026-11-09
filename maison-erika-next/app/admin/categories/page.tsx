import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setCategoryActive, createCategory } from '@/lib/admin/actions'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/admin')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description, is_active, sort_order')
    .order('sort_order', { ascending: true })

  async function handleToggle(id: string, currentStatus: boolean) {
    'use server'
    await setCategoryActive(id, !currentStatus)
  }

  async function handleCreate(formData: FormData) {
    'use server'
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    await createCategory(name, description)
  }

  const categoryList = categories ?? []
  const hasRopa = categoryList.some((c) => c.name.toLowerCase().includes('ropa'))

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand brand-logo admin-brand-logo" href="/admin">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <Link className="pill" href="/admin">
          ← Volver al panel
        </Link>
      </header>

      <section className="admin-content">
        <div className="eyebrow">MAISON ERIKA STUDIO</div>
        <h1>Categorías y Colecciones</h1>
        <p>Activa u oculta las colecciones que aparecen en el menú y filtros de la boutique.</p>

        {/* Special callout regarding Ropa */}
        <div className="admin-ropa-notice">
          <strong>Regla de negocio:</strong> La categoría <em>Ropa</em> permanece oculta por defecto en la tienda hasta que decidas activarla desde este panel.
        </div>

        <div className="category-admin-list">
          {categoryList.map((c) => {
            const isRopa = c.name.toLowerCase().includes('ropa')
            return (
              <article key={c.id} className={isRopa ? 'ropa-highlight-row' : ''}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{c.name}</strong>
                    {isRopa && <span className="ropa-tag">Lanzamiento futuro</span>}
                  </div>
                  <small>/{c.slug} {c.description ? `· ${c.description}` : ''}</small>
                </div>
                <form action={handleToggle.bind(null, c.id, Boolean(c.is_active))}>
                  <span className={c.is_active ? 'status status-active' : 'status status-draft'}>
                    {c.is_active ? 'Visible en tienda' : 'Oculta'}
                  </span>
                  <button className="pill" type="submit">
                    {c.is_active ? 'Ocultar' : 'Activar'}
                  </button>
                </form>
              </article>
            )
          })}
        </div>

        {/* Create Category Form */}
        <section className="catalog-form-card" style={{ marginTop: '35px' }}>
          <div className="eyebrow">NUEVA COLECCIÓN</div>
          <h2>Crear categoría</h2>
          <form action={handleCreate} className="product-form">
            <div className="form-two">
              <label>
                Nombre de la categoría *
                <input name="name" required placeholder="Ej. Bolsos, Joyería Fina, Sombreros" />
              </label>
              <label>
                Descripción (opcional)
                <input name="description" placeholder="Piezas artesanales seleccionadas..." />
              </label>
            </div>
            <button className="primary admin-submit" type="submit">
              CREAR CATEGORÍA ↗
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}
