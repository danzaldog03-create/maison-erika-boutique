'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart/cart-context'

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart()

  if (!isOpen) return null

  return (
    <div className="cart-backdrop" onClick={closeCart}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()} aria-label="Carrito de compras">
        <div className="cart-header">
          <div className="cart-title">
            <span className="eyebrow">TU SELECCIÓN</span>
            <h2>Bolsa de compra ({itemCount})</h2>
          </div>
          <button className="cart-close" onClick={closeCart} aria-label="Cerrar carrito">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="placeholder">✧</span>
            <h3>Tu bolsa está vacía</h3>
            <p>Descubre nuestros pequeños tesoros y llena tus días de detalles especiales.</p>
            <button className="primary" onClick={closeCart}>
              EXPLORAR COLECCIÓN
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.variantId} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span className="placeholder">✧</span>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <Link href={`/productos/${item.slug}`} onClick={closeCart} className="cart-item-name">
                      {item.name}
                    </Link>
                    {item.variantName && item.variantName !== 'Única' && (
                      <span className="cart-item-variant">{item.variantName}</span>
                    )}
                    <span className="cart-item-price">
                      ${Number(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>

                    <div className="cart-item-actions">
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
                        className="cart-item-remove"
                        onClick={() => removeItem(item.variantId)}
                        aria-label="Eliminar artículo"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-subtotal-row">
                <span>Subtotal</span>
                <strong>${Number(subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
              </div>
              <p className="cart-shipping-note">El costo de envío y opciones de entrega se calculan en el checkout.</p>
              <Link href="/checkout" onClick={closeCart} className="primary cart-checkout-btn">
                FINALIZAR PEDIDO ↗
              </Link>
              <button type="button" className="cart-continue-btn" onClick={closeCart}>
                Seguir explorando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
