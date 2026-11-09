'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'

export interface CartItem {
  productId: string
  variantId: string
  name: string
  variantName: string
  price: number
  image: string | null
  maxStock: number
  quantity: number
  slug: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (variantId: string, quantity: number) => void
  removeItem: (variantId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'maison_erika_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (e) {
      console.warn('Failed to read cart from localStorage', e)
    } finally {
      setMounted(true)
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e)
    }
  }, [items, mounted])

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    if (quantity <= 0) return
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId)
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.maxStock > 0 ? existing.maxStock : 99)
        return prev.map((i) => (i.variantId === item.variantId ? { ...i, quantity: newQty, maxStock: item.maxStock } : i))
      }
      const initialQty = Math.min(quantity, item.maxStock > 0 ? item.maxStock : 1)
      return [...prev, { ...item, quantity: initialQty }]
    })
    setIsOpen(true)
  }

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId)
      return
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.variantId === variantId) {
          const validQty = i.maxStock > 0 ? Math.min(quantity, i.maxStock) : quantity
          return { ...i, quantity: validQty }
        }
        return i
      })
    )
  }

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }

  const clearCart = () => {
    setItems([])
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen((prev) => !prev)

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        isOpen,
        openCart,
        closeCart,
        toggleCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
