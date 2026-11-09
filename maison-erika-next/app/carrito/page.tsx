import Link from 'next/link'
import { CartPageView } from '@/components/cart/cart-page-view'
import { getStoreSettings } from '@/lib/settings'

export default async function CartPage() {
  const settings = await getStoreSettings()

  return (
    <main className="cart-page">
      <div className="announcement">{settings.announcement_text}</div>

      <header className="topbar">
        <Link className="pill" href="/">
          ← VOLVER A LA BOUTIQUE
        </Link>
        <Link className="brand brand-logo" href="/" aria-label="Maison Erika, inicio">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div className="actions">
          <span className="pill">BOLSA DE COMPRA</span>
        </div>
      </header>

      <section className="cart-page-container">
        <div className="cart-page-title">
          <span className="eyebrow">TU SELECCIÓN ESPECIAL</span>
          <h1>Bolsa de compra</h1>
        </div>

        <CartPageView
          shippingFlatRate={settings.shipping_flat_rate}
          freeShippingThreshold={settings.free_shipping_threshold}
        />
      </section>

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
          <Link href="/#productos">Productos</Link>
        </div>
        <div>
          <h4>AYUDA</h4>
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
