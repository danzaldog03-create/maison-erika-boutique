'use client'

import React from 'react'
import { useCart } from '@/lib/cart/cart-context'

export function CartButton() {
  const { itemCount, toggleCart } = useCart()

  return (
    <button
      type="button"
      className="pill cart-trigger"
      onClick={toggleCart}
      aria-label={`Ver carrito, ${itemCount} artículos`}
    >
      <span>♡ BOLSA</span>
      {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
    </button>
  )
}
