'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart/cart-context'

export function CartPageView({
  shippingFlatRate,
  freeShippingThreshold
}: {
  shippingFlatRate: number
  freeShippingThreshold: number
}) {
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart()

  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  if (items.length === 0) {
    return (
      <div className="cart-page-empty">
        <span className="placeholder">✧</span>
        <h2>Tu bolsa de compras está vacía</h2>
        <p>Aún no has agregado ninguna pieza a tu selección. Explora nuestras colecciones y déjate enamorar.</p>
        <Link href="/" className="primary">
          EXPLORAR LA BOUTIQUE ↗
        </Link>
      </div>
    )
  }

  return (
    <div className="cart-page-layout">
      {/* Items column */}
      <section className="cart-page-items">
        <div className="cart-page-items-header">
          <h2>Piezas seleccionadas ({itemCount})</h2>
          <button type="button" className="cart-clear-all" onClick={clearCart}>
            Vaciar bolsa
          </button>
        </div>

        {/* Free shipping progress alert */}
        <div className="cart-shipping-banner">
          {qualifiesForFreeShipping ? (
            <span>¡Felicidades! Tu pedido califica para <strong>Envío Gratis</strong> en todo México ♡</span>
          ) : (
            <span>
              Agrega <strong>${amountNeededForFreeShipping.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong> más para obtener <strong>Envío Gratis</strong>.
            </span>
          )}
        </div>

        <div className="cart-page-list">
          {items.map((item) => (
            <div key={item.variantId} className="cart-page-row">
              <div className="cart-page-thumb">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <span className="placeholder">✧</span>
                )}
              </div>

              <div className="cart-page-info">
                <Link href={`/productos/${item.slug}`} className="cart-page-item-title">
                  {item.name}
                </Link>
                {item.variantName && item.variantName !== 'Única' && (
                  <span className="cart-page-item-variant">Variante: {item.variantName}</span>
                )}
                <span className="cart-page-unit-price">
                  ${Number(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN c/u
                </span>
              </div>

              <div className="cart-page-qty-col">
                <div className="qty-picker">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    disabled={item.maxStock > 0 && item.quantity >= item.maxStock}
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="cart-page-delete"
                  onClick={() => removeItem(item.variantId)}
                >
                  Eliminar
                </button>
              </div>

              <div className="cart-page-total-col">
                <strong>
                  ${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </strong>
              </div>
            </div>
          ))}
        </div>

        <Link href="/" className="back-link">
          ← Continuar explorando la boutique
        </Link>
      </section>

      {/* Summary column */}
      <aside className="cart-page-summary">
        <div className="summary-card">
          <h3>Resumen del pedido</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
          </div>

          <div className="summary-row">
            <span>Envío estimado</span>
            <span>
              {qualifiesForFreeShipping ? (
                <strong className="free-shipping-text">GRATIS</strong>
              ) : (
                `$${shippingFlatRate.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
              )}
            </span>
          </div>

          <div className="summary-divider" />

          <div className="summary-row summary-total">
            <span>Total estimado</span>
            <strong>
              ${(subtotal + (qualifiesForFreeShipping ? 0 : shippingFlatRate)).toLocaleString('es-MX', {
                minimumFractionDigits: 2
              })}{' '}
              MXN
            </strong>
          </div>

          <Link href="/checkout" className="primary checkout-big-btn">
            PROCEDER AL CHECKOUT ↗
          </Link>

          <p className="summary-note">
            Pagos seguros mediante transferencia bancaria con confirmación directa por WhatsApp. Envíos con guía rastreable a todo el país.
          </p>
        </div>
      </aside>
    </div>
  )
}
