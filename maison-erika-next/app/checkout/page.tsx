import Link from 'next/link'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { getStoreSettings } from '@/lib/settings'

export default async function CheckoutPage() {
  const settings = await getStoreSettings()

  return (
    <main className="checkout-page">
      <div className="announcement">{settings.announcement_text}</div>

      <header className="topbar">
        <Link className="pill" href="/carrito">
          ← VOLVER A LA BOLSA
        </Link>
        <Link className="brand brand-logo" href="/" aria-label="Maison Erika, inicio">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div className="actions">
          <span className="pill">CHECKOUT SEGURO</span>
        </div>
      </header>

      <section className="checkout-main-container">
        <div className="checkout-header-title">
          <span className="eyebrow">FINALIZA TU COMPRA</span>
          <h1>Checkout Maison Erika</h1>
          <p>Completa tus datos de entrega para preparar tu paquete con todo el cariño.</p>
        </div>

        <CheckoutForm settings={settings} />
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <img src="/maison-erika-logo-transparent.png" alt="Logotipo de Maison Erika" />
          <p>Pequeños tesoros, grandes detalles.</p>
          <span className="footer-location">AGUASCALIENTES · MÉXICO</span>
        </div>
        <div>
          <h4>COMPRA SEGURA</h4>
          <p>Transferencias SPEI directas</p>
          <p>Envíos protegidos a todo México</p>
        </div>
        <div>
          <h4>SOPORTE</h4>
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
