import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/settings'
import { HeroManager } from '@/components/admin/hero-manager'

export default async function AdminHeroPage() {
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
            Ver tienda en vivo ↗
          </Link>
        </div>
      </header>

      <section className="admin-content admin-content-wide">
        <div className="eyebrow">DIRECCIÓN ARTÍSTICA &amp; CONTENIDO</div>
        <h1>Hero y Portada Editorial</h1>
        <p>Configura la campaña principal de la boutique: fotografía de alta calidad o video MP4 en bucle, textos y previsualización en vivo.</p>

        <HeroManager
          initialSettings={settings}
          supabaseUrl={supabaseUrl}
        />
      </section>
    </main>
  )
}
