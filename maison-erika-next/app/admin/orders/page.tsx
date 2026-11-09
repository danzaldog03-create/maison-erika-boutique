import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrdersManager } from '@/components/admin/orders-manager'
import { getStoreSettings } from '@/lib/settings'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/admin')

  const settings = await getStoreSettings()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_reference,
      notes,
      subtotal,
      shipping_cost,
      total,
      payment_method,
      payment_status,
      status,
      tracking_number,
      carrier,
      created_at,
      order_items (
        id,
        product_name,
        variant_name,
        sku,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Orders query notice:', error.message)
  }

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

      <section className="admin-content admin-content-wide">
        <div className="eyebrow">MAISON ERIKA STUDIO</div>
        <h1>Gestión de Pedidos</h1>
        <p>Revisa las compras de tus clientas, confirma pagos, asigna guías de envío y coordina entregas.</p>

        <OrdersManager
          orders={(orders ?? []) as any[]}
          commercialWhatsapp={settings.whatsapp_number}
        />
      </section>
    </main>
  )
}
