import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/settings'
import { saveStoreSettings } from '@/lib/admin/actions'

export default async function AdminSettingsPage() {
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

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand brand-logo admin-brand-logo" href="/admin">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link className="pill" href="/admin/hero">
            🎬 Editar Hero y Portada ↗
          </Link>
          <Link className="pill" href="/admin">
            ← Volver al panel
          </Link>
        </div>
      </header>

      <section className="admin-content">
        <div className="eyebrow">MAISON ERIKA STUDIO</div>
        <h1>Configuración Comercial</h1>
        <p>Administra los datos bancarios, WhatsApp de atención, reglas de paquetería y textos oficiales.</p>

        <form action={saveStoreSettings} className="product-form" style={{ marginTop: '25px' }}>
          {/* WhatsApp Comercial */}
          <div className="catalog-form-card">
            <h2>WhatsApp Comercial y Atención</h2>
            <div className="form-two">
              <label>
                Número de WhatsApp (con lada internacional, sin +) *
                <input
                  name="whatsapp_number"
                  required
                  defaultValue={settings.whatsapp_number}
                  placeholder="524491234567"
                />
              </label>
              <label>
                Mensaje predeterminado de contacto
                <input
                  name="whatsapp_message"
                  defaultValue={settings.whatsapp_message}
                  placeholder="¡Hola! Me gustaría información sobre Maison Erika."
                />
              </label>
            </div>
            <label>
              Correo de contacto oficial
              <input
                name="contact_email"
                type="email"
                defaultValue={settings.contact_email}
                placeholder="hola@maisonerika.mx"
              />
            </label>
          </div>

          {/* Datos Bancarios y Transferencias */}
          <div className="catalog-form-card">
            <h2>Datos Bancarios para Transferencias (SPEI)</h2>
            <div className="form-two">
              <label>
                Nombre del banco *
                <input
                  name="bank_name"
                  required
                  defaultValue={settings.bank_name}
                  placeholder="BBVA México, Santander..."
                />
              </label>
              <label>
                Titular / Beneficiario *
                <input
                  name="bank_beneficiary"
                  required
                  defaultValue={settings.bank_beneficiary}
                  placeholder="Maison Erika / Erika Martínez"
                />
              </label>
            </div>
            <div className="form-two">
              <label>
                CLABE Interbancaria (18 dígitos) *
                <input
                  name="bank_clabe"
                  required
                  maxLength={18}
                  defaultValue={settings.bank_clabe}
                  placeholder="012180000000000000"
                />
              </label>
              <label>
                Número de cuenta o tarjeta (opcional)
                <input
                  name="bank_account"
                  defaultValue={settings.bank_account}
                  placeholder="1234567890"
                />
              </label>
            </div>
            <label>
              Instrucciones de pago para el cliente
              <textarea
                name="bank_instructions"
                rows={3}
                defaultValue={settings.bank_instructions}
                placeholder="Indica al cliente qué concepto colocar y a dónde enviar su comprobante..."
              />
            </label>
          </div>

          {/* Reglas y Costos de Envío */}
          <div className="catalog-form-card">
            <h2>Costos y Reglas de Envío</h2>
            <div className="form-two">
              <label>
                Costo de envío estándar (MXN) *
                <input
                  name="shipping_flat_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={settings.shipping_flat_rate}
                />
              </label>
              <label>
                Monto mínimo para Envío Gratis (MXN) *
                <input
                  name="free_shipping_threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={settings.free_shipping_threshold}
                />
              </label>
            </div>
            <label>
              Tiempo estimado de entrega
              <input
                name="shipping_estimated_days"
                defaultValue={settings.shipping_estimated_days}
                placeholder="3 a 5 días hábiles"
              />
            </label>
          </div>

          {/* Redes Sociales */}
          <div className="catalog-form-card">
            <h2>Redes Sociales</h2>
            <div className="form-two">
              <label>
                Enlace a Instagram
                <input
                  name="instagram_url"
                  defaultValue={settings.instagram_url}
                  placeholder="https://instagram.com/maisonerika"
                />
              </label>
              <label>
                Enlace a Facebook
                <input
                  name="facebook_url"
                  defaultValue={settings.facebook_url}
                  placeholder="https://facebook.com/maisonerika"
                />
              </label>
            </div>
            <label>
              Enlace a TikTok
              <input
                name="tiktok_url"
                defaultValue={settings.tiktok_url}
                placeholder="https://tiktok.com/@maisonerika"
              />
            </label>
          </div>

          {/* Textos de la Tienda */}
          <div className="catalog-form-card">
            <h2>Textos de la Tienda y Portada</h2>
            <label>
              Barra superior de anuncios
              <input
                name="announcement_text"
                defaultValue={settings.announcement_text}
                placeholder="UN DETALLE BONITO PUEDE CAMBIAR TODO · ENVÍOS A TODO MÉXICO"
              />
            </label>
            <div className="form-two">
              <label>
                Cintillo del Hero (Eyebrow)
                <input
                  name="hero_eyebrow"
                  defaultValue={settings.hero_eyebrow}
                  placeholder="A LITTLE WORLD OF BEAUTY"
                />
              </label>
              <label>
                Título Principal del Hero
                <input
                  name="hero_title"
                  defaultValue={settings.hero_title}
                  placeholder="Pequeños tesoros, grandes detalles."
                />
              </label>
            </div>
            <label>
              Subtítulo del Hero
              <input
                name="hero_subtitle"
                defaultValue={settings.hero_subtitle}
                placeholder="Accesorios para acompañarte, hacerte brillar y convertir cualquier día en una ocasión especial."
              />
            </label>
            <label>
              Título de la Historia
              <input
                name="story_title"
                defaultValue={settings.story_title}
                placeholder="La belleza está en los detalles."
              />
            </label>
            <label>
              Contenido de la Historia (Aguascalientes)
              <textarea
                name="story_content"
                rows={4}
                defaultValue={settings.story_content}
                placeholder="Historia de origen y misión de Maison Erika..."
              />
            </label>
          </div>

          <div style={{ position: 'sticky', bottom: '20px', background: 'white', padding: '16px', border: '1px solid var(--line)', borderRadius: '4px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link href="/admin" className="pill">
              Cancelar
            </Link>
            <button type="submit" className="primary">
              GUARDAR CONFIGURACIÓN ↗
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
