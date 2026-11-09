'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/cart-context'
import { createOrder } from '@/lib/orders/actions'
import { StoreSettings } from '@/lib/settings'

export function CheckoutForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const qualifiesForFreeShipping = subtotal >= settings.free_shipping_threshold
  const shippingCost = qualifiesForFreeShipping ? 0 : settings.shipping_flat_rate
  const grandTotal = subtotal + shippingCost

  if (items.length === 0) {
    return (
      <div className="checkout-empty-state">
        <span className="placeholder">✧</span>
        <h2>Tu bolsa de compras está vacía</h2>
        <p>No tienes artículos pendientes de pago en este momento.</p>
        <Link href="/" className="primary">
          EXPLORAR LA COLECCIÓN ↗
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const orderPayload = {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_postal_code: postalCode,
        shipping_reference: reference || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity
        }))
      }

      const res = await createOrder(orderPayload)

      if (!res.success || !res.orderId) {
        setErrorMessage(res.error || 'No se pudo completar el pedido. Revisa tus datos e intenta nuevamente.')
        setLoading(false)
        return
      }

      // Success: clear cart and redirect to confirmation page
      clearCart()
      router.push(`/pedidos/${res.orderId}`)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al procesar tu pedido.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-grid">
      {/* Left Column: Contact and Shipping Info */}
      <div className="checkout-form-column">
        {errorMessage && (
          <div className="checkout-error-banner" role="alert">
            <strong>Atención:</strong> {errorMessage}
          </div>
        )}

        <section className="checkout-card">
          <div className="card-head">
            <span className="step-num">1</span>
            <h2>Datos de contacto</h2>
          </div>
          <div className="form-fields">
            <label>
              Nombre completo *
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Erika Martínez González"
              />
            </label>

            <div className="form-row-two">
              <label>
                Correo electrónico *
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </label>
              <label>
                Teléfono / WhatsApp *
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="449 123 4567"
                />
              </label>
            </div>
            <small className="field-hint">Te contactaremos por WhatsApp o correo para confirmar tu pago y envío.</small>
          </div>
        </section>

        <section className="checkout-card">
          <div className="card-head">
            <span className="step-num">2</span>
            <h2>Dirección de entrega</h2>
          </div>
          <div className="form-fields">
            <label>
              Calle y número (exterior e interior) *
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Las Américas 123, Int. 4B"
              />
            </label>

            <div className="form-row-two">
              <label>
                Ciudad / Municipio *
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Aguascalientes"
                />
              </label>
              <label>
                Estado *
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Aguascalientes"
                />
              </label>
            </div>

            <div className="form-row-two">
              <label>
                Código Postal (5 dígitos) *
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="20000"
                />
              </label>
              <label>
                Referencias de entrega (opcional)
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Entre calle Hidalgo y Morelos"
                />
              </label>
            </div>

            <label>
              Instrucciones adicionales o dedicatoria para regalo (opcional)
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Si es un regalo, escribe aquí una nota especial..."
              />
            </label>
          </div>
        </section>

        <section className="checkout-card">
          <div className="card-head">
            <span className="step-num">3</span>
            <h2>Método de pago</h2>
          </div>
          <div className="payment-method-box">
            <div className="payment-option selected">
              <div className="payment-option-header">
                <input type="radio" checked readOnly id="bank_transfer" />
                <label htmlFor="bank_transfer">
                  <strong>Transferencia Bancaria (SPEI)</strong>
                  <span>Sin comisiones adicionales · Confirmación inmediata por WhatsApp</span>
                </label>
              </div>
              <div className="payment-option-body">
                <p>
                  Al confirmar tu pedido, verás los datos de la cuenta bancaria (<strong>{settings.bank_name}</strong>) y la CLABE interbancaria para realizar tu transferencia cómodamente desde tu banca móvil.
                </p>
                <div className="payment-instructions-preview">
                  <span>Banco: {settings.bank_name}</span>
                  <span>Beneficiario: {settings.bank_beneficiary}</span>
                  <span>CLABE: {settings.bank_clabe}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Order Summary */}
      <div className="checkout-summary-column">
        <aside className="checkout-summary-card">
          <h3>Resumen de compra</h3>

          <div className="checkout-items-scroll">
            {items.map((i) => (
              <div key={i.variantId} className="checkout-item-line">
                <div className="checkout-item-thumb">
                  {i.image ? <img src={i.image} alt={i.name} /> : <span>✧</span>}
                  <span className="checkout-qty-badge">{i.quantity}</span>
                </div>
                <div className="checkout-item-info">
                  <strong>{i.name}</strong>
                  {i.variantName && i.variantName !== 'Única' && <small>{i.variantName}</small>}
                  <span>${Number(i.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>
                <div className="checkout-item-line-total">
                  ${(i.price * i.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-calc-box">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
            </div>

            <div className="summary-row">
              <span>Envío ({settings.shipping_estimated_days})</span>
              <span>
                {qualifiesForFreeShipping ? (
                  <strong className="free-shipping-text">GRATIS</strong>
                ) : (
                  `$${shippingCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
                )}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row summary-grand-total">
              <span>Total a pagar</span>
              <strong>${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary checkout-submit-btn"
          >
            {loading ? 'GENERANDO PEDIDO...' : 'CONFIRMAR PEDIDO Y PAGAR ↗'}
          </button>

          <p className="checkout-security-notice">
            🔒 Tu información está protegida. Al realizar el pedido reservamos tus piezas y te proporcionamos tu referencia de pago única.
          </p>
        </aside>
      </div>
    </form>
  )
}
