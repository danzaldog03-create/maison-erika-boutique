'use client'

import React, { useState } from 'react'
import { LookItem, DEFAULT_LOOKS } from '@/lib/settings-types'

export type { LookItem }

const FALLBACK_LOOK_IMAGES = [
  '/looks/look-1-aretes.jpg',
  '/looks/look-2-collar.jpg',
  '/looks/look-3-anillos.jpg',
  '/looks/look-4-unboxing.jpg'
]

interface ShopTheLookProps {
  looks?: LookItem[]
  instagramUrl?: string
  whatsappNumber?: string
  supabaseUrl?: string
}

export function ShopTheLook({
  looks = DEFAULT_LOOKS,
  instagramUrl = 'https://instagram.com/maisonerika',
  whatsappNumber = '524490000000',
  supabaseUrl = 'https://jvbaszjtjhzgrarkbhvt.supabase.co'
}: ShopTheLookProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  const resolveUrl = (url?: string, idx: number = 0) => {
    const raw = (url ?? '').trim()
    if (!raw) {
      return FALLBACK_LOOK_IMAGES[idx % 4]
    }
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('blob:')) {
      return raw
    }
    const base = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbaszjtjhzgrarkbhvt.supabase.co'
    return `${base}/storage/v1/object/public/product-media/${raw}`
  }

  const items = (looks && looks.length > 0) ? looks : DEFAULT_LOOKS

  return (
    <section className="shop-the-look-section" id="social">
      <div className="section-head text-center">
        <div className="editorial-section-eyebrow">SHOP THE LOOK · ESTILO EN MOVIMIENTO</div>
        <h2>Inspírate. Elige. Brilla.</h2>
        <p>
          Descubre cómo lucen nuestros accesorios y piezas de autor en combinaciones reales diseñadas para enamorar.
        </p>
      </div>

      {/* Commercial Lookbook Grid (Fotos, GIFs y Videos) */}
      <div className="lookbook-grid">
        {items.map((look, idx) => {
          const resolvedMedia = resolveUrl(look.mediaUrl, idx)
          const resolvedVideo = look.videoUrl ? resolveUrl(look.videoUrl, idx) : ''
          const isVideo = look.mediaType === 'video' && Boolean(resolvedVideo)
          const isGif = resolvedMedia.toLowerCase().endsWith('.gif')

          return (
            <article
              key={look.id || idx}
              className="lookbook-card"
              onMouseEnter={() => isVideo && setActiveVideo(look.id)}
              onMouseLeave={() => isVideo && setActiveVideo(null)}
            >
              {/* Media Layer: Looping Video, Animated GIF or High-Res Photography */}
              <div className="lookbook-media-container">
                {isVideo && resolvedVideo ? (
                  <video
                    className="lookbook-media"
                    src={resolvedVideo}
                    poster={resolvedMedia || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    className="lookbook-media"
                    src={resolvedMedia || FALLBACK_LOOK_IMAGES[idx % 4]}
                    alt={look.title || 'Maison Erika Look'}
                    loading="lazy"
                  />
                )}

                {/* Dark Luxury Gradient for Readability */}
                <div className="lookbook-overlay" />

                {/* Top Floating Badge & Format Indicator */}
                <div className="lookbook-top-bar">
                  <span className="lookbook-badge">{look.badge}</span>
                  {isVideo && <span className="lookbook-reel-indicator">▶ Video Reel</span>}
                  {isGif && !isVideo && <span className="lookbook-reel-indicator">GIF</span>}
                </div>

                {/* Bottom Commercial Content */}
                <div className="lookbook-content">
                  {look.priceHint && (
                    <div className="lookbook-price-hint">{look.priceHint}</div>
                  )}
                  <h3 className="lookbook-title">{look.title}</h3>
                  <p className="lookbook-subtitle">{look.subtitle}</p>

                  <a
                    href={look.ctaUrl || '#productos'}
                    className="lookbook-cta-btn"
                  >
                    <span>{look.ctaText || 'Comprar este look ↗'}</span>
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Social and Concierge Footer Bar */}
      <div className="lookbook-footer-bar">
        <div className="lookbook-social-pill">
          <span>¿Buscas una combinación a tu medida?</span>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola! Me encantaron los looks de la tienda. ¿Me podrían ayudar a elegir una combinación especial?')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="lookbook-pill-link"
          >
            Asesoría por WhatsApp ↗
          </a>
        </div>
        <div className="lookbook-social-pill">
          <span>Síguenos en redes:</span>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lookbook-pill-link"
          >
            Instagram @maisonerika ↗
          </a>
        </div>
      </div>
    </section>
  )
}
