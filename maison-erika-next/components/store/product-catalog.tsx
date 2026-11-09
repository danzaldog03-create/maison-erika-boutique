'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart/cart-context'

export interface CatalogProduct {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  material: string | null
  price: number
  compare_at_price: number | null
  sku: string | null
  is_featured: boolean
  is_new: boolean
  category_id: string
  category_name?: string
  total_stock: number
  primary_variant_id: string
  images: { storage_path: string; alt_text: string | null; is_primary: boolean }[]
}

export interface CatalogCategory {
  id: string
  name: string
  slug: string
}

export function ProductCatalog({
  products,
  categories,
  supabaseUrl
}: {
  products: CatalogProduct[]
  categories: CatalogCategory[]
  supabaseUrl: string
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { addItem } = useCart()

  const imageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path
    }
    return `${supabaseUrl}/storage/v1/object/public/product-media/${path}`
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.short_description && p.short_description.toLowerCase().includes(query)) ||
        (p.material && p.material.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  const handleQuickAdd = (p: CatalogProduct) => {
    const primaryImg = p.images.find((x) => x.is_primary) ?? p.images[0]
    addItem(
      {
        productId: p.id,
        variantId: p.primary_variant_id || p.id,
        name: p.name,
        variantName: 'Única',
        price: Number(p.price),
        image: primaryImg ? imageUrl(primaryImg.storage_path) : null,
        maxStock: p.total_stock,
        slug: p.slug
      },
      1
    )
  }

  return (
    <div className="catalog-wrapper">
      {/* Category filter pills and search bar */}
      <div className="catalog-toolbar">
        <div className="catalog-categories-bar" role="tablist" aria-label="Filtrar por colección">
          <button
            type="button"
            className={`catalog-cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Todas ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length
            return (
              <button
                key={c.id}
                type="button"
                className={`catalog-cat-pill ${selectedCategory === c.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.name} ({count})
              </button>
            )
          })}
        </div>

        <div className="catalog-search-box">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar aretes, collares, materiales..."
            aria-label="Buscar productos en el catálogo"
          />
          {searchQuery && (
            <button
              type="button"
              className="catalog-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="products">
        {filteredProducts.map((p) => {
          const img = p.images.find((x) => x.is_primary) ?? p.images[0]
          const isAvailable = p.total_stock > 0

          return (
            <article className="product" key={p.id}>
              <Link href={`/productos/${p.slug}`} className="photo" tabIndex={-1}>
                {img ? (
                  <img src={imageUrl(img.storage_path)} alt={img.alt_text ?? p.name} loading="lazy" />
                ) : (
                  <span className="placeholder">✧</span>
                )}
                {p.is_new && <span className="tag">NUEVO</span>}
                {!isAvailable && <span className="tag tag-soldout">AGOTADO</span>}
              </Link>

              <div className="product-meta-header">
                {p.category_name && <span className="product-category-label">{p.category_name}</span>}
                {isAvailable && (
                  <span className="stock-indicator in-stock">
                    {p.total_stock <= 3 ? `¡Sólo ${p.total_stock} disponibles!` : 'Disponible'}
                  </span>
                )}
              </div>

              <h3>
                <Link href={`/productos/${p.slug}`}>{p.name}</Link>
              </h3>

              {p.short_description && <p className="desc">{p.short_description}</p>}

              <div className="price-row">
                <div className="price">${Number(p.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</div>
                {p.compare_at_price && p.compare_at_price > p.price && (
                  <span className="compare-price">
                    ${Number(p.compare_at_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                )}
              </div>

              <div className="product-card-actions">
                {isAvailable ? (
                  <button
                    type="button"
                    className="add"
                    onClick={() => handleQuickAdd(p)}
                    aria-label={`Agregar ${p.name} a la bolsa`}
                  >
                    AGREGAR A LA BOLSA ♡
                  </button>
                ) : (
                  <button type="button" className="add" disabled>
                    AGOTADO TEMPORALMENTE
                  </button>
                )}
                <Link href={`/productos/${p.slug}`} className="view-details-link">
                  Ver detalles ↗
                </Link>
              </div>
            </article>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="empty">
            <span className="placeholder">✧</span>
            <h3>No encontramos piezas con este criterio</h3>
            <p>Intenta con otra palabra clave o selecciona otra colección.</p>
            <button
              type="button"
              className="pill"
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
            >
              Ver todo el catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
