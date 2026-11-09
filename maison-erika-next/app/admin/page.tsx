import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1>Acceso restringido</h1>
          <p>Esta cuenta no tiene permisos de administración.</p>
          <p style={{ fontWeight: 600 }}>{user.email}</p>
          <form action="/auth/signout" method="post" style={{ marginTop: '15px' }}>
            <button className="pill">Cerrar sesión</button>
          </form>
          <Link href="/" className="back-link">
            ← Volver a la boutique
          </Link>
        </div>
      </main>
    )
  }

  const [
    { count: productCount },
    { count: orderCount },
    { count: categoryCount },
    { data: confirmedOrders }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total').in('status', ['confirmado', 'enviado', 'entregado'])
  ])

  const totalSales = (confirmedOrders ?? []).reduce((sum, o) => sum + Number(o.total || 0), 0)

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand brand-logo admin-brand-logo" href="/" aria-label="Maison Erika, tienda">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{user.email}</span>
          <Link className="pill" href="/" target="_blank">
            Ver tienda ↗
          </Link>
          <form style={{ display: 'inline' }} action="/auth/signout" method="post">
            <button className="pill">Salir</button>
          </form>
        </div>
      </header>

      <section className="admin-content">
        <div className="eyebrow">PANEL DE CONTROL GENERAL</div>
        <h1>Hola, {profile.full_name || 'Erika'} ♡</h1>
        <p>Tu boutique Maison Erika, organizada y bajo control.</p>

        {/* Quick Stats Grid */}
        <div className="admin-stats">
          <article>
            <span>Piezas en Catálogo</span>
            <strong>{productCount ?? 0}</strong>
          </article>
          <article>
            <span>Pedidos Totales</span>
            <strong>{orderCount ?? 0}</strong>
          </article>
          <article>
            <span>Colecciones Activas</span>
            <strong>{categoryCount ?? 0}</strong>
          </article>
          <article>
            <span>Ventas Confirmadas</span>
            <strong>${totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
          </article>
        </div>

        {/* Modules Navigation Cards */}
        <div className="admin-modules">
          <Link href="/admin/hero">
            <h2>Hero y Portada Editorial</h2>
            <p>Configura la campaña visual principal: fotografía o video MP4 en bucle, textos comerciales y previsualización en vivo.</p>
            <span>Diseñar portada ↗</span>
          </Link>

          <Link href="/admin/looks">
            <h2>Shop The Look &amp; Video Reels</h2>
            <p>Personaliza las 4 vitrinas comerciales de la portada: sube fotografías, GIFs animados o videos MP4 en bucle, insignias y botones de compra.</p>
            <span>Editar vitrinas y reels ↗</span>
          </Link>

          <Link href="/admin/products">
            <h2>Catálogo y Productos</h2>
            <p>Alta, edición y baja lógica de piezas, precios, SKU, fotografías, variantes y control de existencias.</p>
            <span>Administrar catálogo ↗</span>
          </Link>

          <Link href="/admin/categories">
            <h2>Colecciones y Categorías</h2>
            <p>Activa u oculta colecciones en la tienda. La categoría Ropa permanece protegida por defecto.</p>
            <span>Administrar categorías ↗</span>
          </Link>

          <Link href="/admin/orders">
            <h2>Gestión de Pedidos</h2>
            <p>Consulta compras, actualiza estados (pendiente, confirmado, enviado, entregado), asigna guías y envía mensajes por WhatsApp.</p>
            <span>Gestionar pedidos ↗</span>
          </Link>

          <Link href="/admin/settings">
            <h2>Configuración Comercial</h2>
            <p>WhatsApp de contacto, cuentas bancarias para transferencias SPEI, reglas de envío y textos oficiales.</p>
            <span>Editar configuración ↗</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
