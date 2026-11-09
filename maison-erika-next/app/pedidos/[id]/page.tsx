import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderDetails } from '@/lib/orders/actions'
import { getStoreSettings } from '@/lib/settings'

export default async function OrderConfirmationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderDetails(id)
  const settings = await getStoreSettings()

  if (!order) notFound()

  const statusLabel: Record<string, { text: string; class: string }> = {
    pendiente: { text: 'Pendiente de pago', class: 'status-draft' },
    confirmado: { text: 'Pago confirmado', class: 'status-active' },
    enviado: { text: 'En camino / Enviado', class: 'status-active' },
    entregado: { text: 'Entregado con éxito', class: 'status-active' },
    cancelado: { text: 'Cancelado', class: 'status-archived' }
  }

  const currentStatus = statusLabel[order.status] ?? { text: order.status, class: 'status-draft' }

  const whatsappReceiptMessage = `¡Hola Maison Erika! Realicé el pedido #${order.order_number} por $${Number(
    order.total
  ).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN. Adjunto mi comprobante de pago para validar mi envío.`

  const whatsappReceiptUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(
    whatsappReceiptMessage
  )}`

  return (
    <main className="order-confirmation-page">
      <div className="announcement">{settings.announcement_text}</div>

      <header className="topbar">
        <Link className="pill" href="/">
          ← VOLVER A LA BOUTIQUE
        </Link>
        <Link className="brand brand-logo" href="/" aria-label="Maison Erika, inicio">
          <img src="/maison-erika-logo-transparent.png" alt="Maison Erika" />
        </Link>
        <div className="actions">
          <Link className="pill" href="/">
            SHOP
          </Link>
        </div>
      </header>

      <section className="order-confirmation-container">
        {/* Success header */}
        <div className="order-success-header">
          <span className="order-heart-icon">♡</span>
          <div className="eyebrow">¡GRACIAS POR TU COMPRA!</div>
          <h1>Pedido {order.order_number}</h1>
          <p>
            Hemos registrado tu pedido. Sigue las instrucciones a continuación para completar tu pago por transferencia y comenzar a preparar tu envío.
          </p>
          <div className="order-status-badge">
            Estado del pedido: <span className={`status ${currentStatus.class}`}>{currentStatus.text}</span>
          </div>
        </div>

        <div className="order-layout-grid">
          {/* Left Column: Bank Transfer Card & Shipping */}
          <div className="order-details-column">
            {/* Transfer Instructions Card */}
            <div className="order-card bank-transfer-card">
              <div className="card-head">
                <span className="eyebrow">INSTRUCCIONES DE PAGO</span>
                <h2>Transferencia Bancaria (SPEI)</h2>
              </div>
              <p className="transfer-instruction-lead">{settings.bank_instructions}</p>

              <div className="bank-data-table">
                <div className="bank-data-row">
                  <span>Banco receptor:</span>
                  <strong>{settings.bank_name}</strong>
                </div>
                <div className="bank-data-row">
                  <span>Beneficiario:</span>
                  <strong>{settings.bank_beneficiary}</strong>
                </div>
                <div className="bank-data-row">
                  <span>CLABE Interbancaria:</span>
                  <strong className="clabe-code">{settings.bank_clabe}</strong>
                </div>
                {settings.bank_account && (
                  <div className="bank-data-row">
                    <span>Número de cuenta:</span>
                    <strong>{settings.bank_account}</strong>
                  </div>
                )}
                <div className="bank-data-row">
                  <span>Concepto / Referencia:</span>
                  <strong className="reference-code">{order.order_number}</strong>
                </div>
                <div className="bank-data-row bank-total-row">
                  <span>Importe exacto a transferir:</span>
                  <strong>
                    ${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </strong>
                </div>
              </div>

              <div className="bank-cta-box">
                <a
                  href={whatsappReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary whatsapp-receipt-btn"
                >
                  ENVIAR COMPROBANTE POR WHATSAPP ↗
                </a>
                <small>Una vez recibido tu comprobante, confirmaremos tu compra en minutos.</small>
              </div>
            </div>

            {/* Tracking information if shipped */}
            {(order.tracking_number || order.carrier) && (
              <div className="order-card tracking-card">
                <h3>Información de paquetería</h3>
                {order.carrier && <p><strong>Paquetería:</strong> {order.carrier}</p>}
                {order.tracking_number && (
                  <p><strong>Número de guía / rastreo:</strong> <code>{order.tracking_number}</code></p>
                )}
              </div>
            )}

            {/* Delivery Details */}
            <div className="order-card shipping-card">
              <h3>Datos de entrega</h3>
              <p>
                <strong>Cliente:</strong> {order.customer_name}
              </p>
              <p>
                <strong>Contacto:</strong> {order.customer_phone} · {order.customer_email}
              </p>
              <p>
                <strong>Dirección:</strong> {order.shipping_address}, {order.shipping_city}, {order.shipping_state}, C.P. {order.shipping_postal_code}
              </p>
              {order.shipping_reference && (
                <p>
                  <strong>Referencias:</strong> {order.shipping_reference}
                </p>
              )}
              {order.notes && (
                <p>
                  <strong>Notas del cliente:</strong> {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Purchased Items & Financial Breakdown */}
          <div className="order-summary-column">
            <div className="order-card items-summary-card">
              <h3>Artículos comprados</h3>

              <div className="order-items-table">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="order-item-row">
                    <div className="order-item-desc">
                      <strong>{item.product_name}</strong>
                      {item.variant_name && item.variant_name !== 'Única' && (
                        <small>Variante: {item.variant_name}</small>
                      )}
                      {item.sku && <small>SKU: {item.sku}</small>}
                      <span className="order-item-math">
                        ${Number(item.unit_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} x {item.quantity}
                      </span>
                    </div>
                    <div className="order-item-subtotal">
                      ${Number(item.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-calc-box">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>${Number(order.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
                <div className="summary-row">
                  <span>Envío</span>
                  <span>
                    {Number(order.shipping_cost) === 0 ? (
                      <strong className="free-shipping-text">GRATIS</strong>
                    ) : (
                      `$${Number(order.shipping_cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
                    )}
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row summary-grand-total">
                  <span>Total</span>
                  <strong>${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
              </div>

              <Link href="/" className="primary continue-shopping-btn">
                VOLVER AL CATÁLOGO DE LA TIENDA ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <img src="/maison-erika-logo-transparent.png" alt="Logotipo de Maison Erika" />
          <p>Pequeños tesoros, grandes detalles.</p>
          <span className="footer-location">AGUASCALIENTES · MÉXICO</span>
        </div>
        <div>
          <h4>MAISON ERIKA</h4>
          <Link href="/">Inicio</Link>
          <Link href="/#colecciones">Colecciones</Link>
        </div>
        <div>
          <h4>AYUDA</h4>
          <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
          <a href={whatsappReceiptUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp de Atención
          </a>
        </div>
      </footer>
      <div className="copyright">© {new Date().getFullYear()} MAISON ERIKA · HECHO CON AMOR ♡</div>
    </main>
  )
}
