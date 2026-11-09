'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/cart-context'

export interface ProductDetailData {
  id: string
  name: string
  slug: string
  sku: string | null
  material: string | null
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  category_name: string
  images: { id?: string; storage_path: string; alt_text: string | null; is_primary: boolean }[]
  variants: { id: string; name: string; sku: string | null; stock_quantity: number; is_active: boolean; price_override: number | null }[]
}

export function ProductDetailView({
  product,
  supabaseUrl,
  whatsappNumber
}: {
  product: ProductDetailData
  supabaseUrl: string
  whatsappNumber: string
}) {
  const router = useRouter()
  const { addItem } = useCart()

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const activeVariants = product.variants.filter((v) => v.is_active !== false)
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    activeVariants[0]?.id || product.id
  )
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0]
  const currentStock = selectedVariant?.stock_quantity ?? 0
  const isAvailable = currentStock > 0

  const effectivePrice = selectedVariant?.price_override != null ? Number(selectedVariant.price_override) : Number(product.price)

  const imageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path
    }
    return `${supabaseUrl}/storage/v1/object/public/product-media/${path}`
  }

  const handleAddToCart = (redirect = false) => {
    if (!isAvailable) return
    const activeImg = product.images[activeImageIndex] ?? product.images[0]
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id || product.id,
        name: product.name,
        variantName: selectedVariant?.name || 'Única',
        price: effectivePrice,
        image: activeImg ? imageUrl(activeImg.storage_path) : null,
        maxStock: currentStock,
        slug: product.slug
      },
      quantity
    )

    if (redirect) {
      router.push('/checkout')
    }
  }

  const activeImage = product.images[activeImageIndex]

  const whatsappInquiryUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `¡Hola Maison Erika! Me encantó la pieza "${product.name}" (${product.sku ? `SKU: ${product.sku}` : ''}) y quisiera más información.`
  )}`

  return (
    <section className="product-detail">
      {/* Gallery */}
      <div className="product-gallery-container">
        <div className="product-gallery-main">
          {activeImage ? (
            <img
              src={imageUrl(activeImage.storage_path)}
              alt={activeImage.alt_text ?? product.name}
            />
          ) : (
            <div className="product-gallery-empty">✧</div>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="product-gallery-thumbs">
            {product.images.map((img, idx) => (
              <button
                key={img.storage_path}
                type="button"
                className={`gallery-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`Ver foto ${idx + 1}`}
              >
                <img src={imageUrl(img.storage_path)} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Copy & Actions */}
      <div className="product-detail-copy">
        <div className="product-detail-badges">
          <span className="eyebrow">MAISON ERIKA · {product.category_name.toUpperCase()}</span>
          {isAvailable ? (
            <span className="stock-pill in-stock">
              {currentStock <= 5 ? `¡Últimas ${currentStock} piezas!` : 'En existencia'}
            </span>
          ) : (
            <span className="stock-pill out-of-stock">Agotado temporalmente</span>
          )}
        </div>

        <h1>{product.name}</h1>

        <div className="product-detail-price-box">
          <span className="product-detail-price">
            ${effectivePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </span>
          {product.compare_at_price && product.compare_at_price > effectivePrice && (
            <span className="product-compare-at">
              ${Number(product.compare_at_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </span>
          )}
        </div>

        {product.short_description && <p className="product-detail-lead">{product.short_description}</p>}

        {/* Variant selection if more than 1 */}
        {activeVariants.length > 1 && (
          <div className="product-variant-picker">
            <label className="variant-label">Variante / Opción:</label>
            <div className="variant-options">
              {activeVariants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`variant-pill ${v.id === selectedVariantId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedVariantId(v.id)
                    setQuantity(1)
                  }}
                >
                  {v.name} ({v.stock_quantity > 0 ? `${v.stock_quantity} disp.` : 'Agotado'})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity selector and actions */}
        {isAvailable ? (
          <div className="product-buy-controls">
            <div className="qty-control-wrap">
              <label htmlFor="pdp-qty">Cantidad:</label>
              <div className="qty-picker pdp-qty-picker">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  id="pdp-qty"
                  type="number"
                  min="1"
                  max={currentStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setQuantity(Math.min(Math.max(1, val), currentStock))
                  }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="pdp-buttons-group">
              <button
                type="button"
                className="primary pdp-add-cart-btn"
                onClick={() => handleAddToCart(false)}
              >
                AGREGAR A LA BOLSA ♡
              </button>

              <button
                type="button"
                className="pdp-buy-now-btn"
                onClick={() => handleAddToCart(true)}
              >
                COMPRAR AHORA ↗
              </button>
            </div>
          </div>
        ) : (
          <div className="product-soldout-box">
            <p>Esta pieza está agotada en este momento. Pregúntanos por disponibilidad o fechas de resurtido.</p>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pill pdp-wa-btn"
            >
              Consultar resurtido por WhatsApp ↗
            </a>
          </div>
        )}

        {/* Metadata info */}
        <div className="product-meta-specs">
          {product.material && (
            <div className="meta-spec-row">
              <strong>Material:</strong> <span>{product.material}</span>
            </div>
          )}
          {product.sku && (
            <div className="meta-spec-row">
              <strong>SKU:</strong> <span>{product.sku}</span>
            </div>
          )}
          <div className="meta-spec-row">
            <strong>Envío:</strong> <span>Envíos seguros a todo México. Entrega en 3 a 5 días hábiles.</span>
          </div>
        </div>

        {product.description && (
          <div className="product-detail-description">
            <h3>Detalles de la pieza</h3>
            <p>{product.description}</p>
          </div>
        )}

        <div className="pdp-whatsapp-help">
          <span>¿Tienes dudas sobre esta pieza?</span>
          <a href={whatsappInquiryUrl} target="_blank" rel="noopener noreferrer">
            Hablar con Maison Erika por WhatsApp ↗
          </a>
        </div>
      </div>
    </section>
  )
}
