'use client'

import React from 'react'
import Link from 'next/link'
import { StoreSettings } from '@/lib/settings'

export function EditorialHero({
  settings,
  supabaseUrl
}: {
  settings: StoreSettings
  supabaseUrl: string
}) {
  if (!settings.hero_is_active) {
    return null
  }

  const resolveMediaUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path
    }
    return `${supabaseUrl}/storage/v1/object/public/product-media/${path}`
  }

  const mediaType = settings.hero_media_type || 'image'
  const imageUrl = resolveMediaUrl(settings.hero_image_path || '/hero/editorial-jewelry-hero.jpg')
  const videoUrl = resolveMediaUrl(settings.hero_video_path)
  const posterUrl = resolveMediaUrl(settings.hero_video_poster_path || '/hero/editorial-poster.jpg')

  // Split title if it contains commas or breaks
  const titleParts = settings.hero_title.includes(',')
    ? settings.hero_title.split(',')
    : [settings.hero_title]

  return (
    <section className="editorial-hero" aria-label="Campaña principal Maison Erika">
      <div className="editorial-hero-container">
        {/* Left Column: Commercial Editorial Copy */}
        <div className="editorial-hero-copy">
          <div className="editorial-eyebrow-row">
            <span className="editorial-eyebrow-dot">✦</span>
            <span className="editorial-eyebrow">{settings.hero_eyebrow}</span>
          </div>

          <h1 className="editorial-hero-title">
            {titleParts[0]}
            {titleParts.length > 1 && (
              <>
                ,<br />
                <em>{titleParts.slice(1).join(',')}</em>
              </>
            )}
          </h1>

          <p className="editorial-hero-lead">{settings.hero_subtitle}</p>

          <div className="editorial-hero-actions">
            <a href={settings.hero_button_url || '#productos'} className="primary editorial-cta-btn">
              <span>{settings.hero_button_text || 'Descubrir colección'}</span>
              <span className="cta-arrow">↗</span>
            </a>
            <a href="#colecciones" className="editorial-secondary-link">
              Ver colecciones
            </a>
          </div>

          <div className="editorial-provenance-badge">
            <div className="provenance-seal">
              <span>AGS</span>
            </div>
            <div className="provenance-text">
              <strong>Diseño &amp; Selección Curada</strong>
              <small>Aguascalientes, México · Envíos seguros a todo el país</small>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Media Frame (Photo / Looping Video) */}
        <div className="editorial-hero-media-wrap">
          <div className="editorial-media-card">
            {mediaType === 'video' && videoUrl ? (
              <video
                className="editorial-media-element"
                autoPlay
                muted
                loop
                playsInline
                poster={posterUrl || imageUrl}
                src={videoUrl}
              >
                Tu navegador no soporta videos HTML5.
              </video>
            ) : (
              <img
                src={imageUrl}
                alt={settings.hero_title}
                className="editorial-media-element"
                loading="eager"
              />
            )}

            <div className="editorial-media-overlay" />

            {/* Subtle editorial label overlay */}
            <div className="editorial-floating-tag">
              <span className="tag-sparkle">✧</span>
              <span>Edición Especial Maison Erika</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
