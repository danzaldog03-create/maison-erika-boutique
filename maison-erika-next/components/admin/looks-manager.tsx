'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LookItem, DEFAULT_LOOKS } from '@/lib/settings-types'
import { saveStoreSettings } from '@/lib/admin/actions'
import { getInstagramHandle } from '@/components/store/shop-the-look'

interface LooksManagerProps {
  initialLooks: LookItem[]
  allSettings: any
  supabaseUrl: string
}

const FALLBACK_LOOK_IMAGES = [
  '/looks/look-1-aretes.jpg',
  '/looks/look-2-collar.jpg',
  '/looks/look-3-anillos.jpg',
  '/looks/look-4-unboxing.jpg'
]

export function LooksManager({ initialLooks, allSettings, supabaseUrl }: LooksManagerProps) {
  const router = useRouter()
  const [looks, setLooks] = useState<LookItem[]>(
    initialLooks && initialLooks.length > 0 ? initialLooks : DEFAULT_LOOKS
  )
  const [instagramUrl, setInstagramUrl] = useState(
    allSettings?.instagram_url || 'https://www.instagram.com/erika_maison_ags/'
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const currentLook = looks[selectedIndex] || looks[0] || DEFAULT_LOOKS[0]

  const resolveMediaUrl = (url?: string, idx: number = 0) => {
    const raw = (url ?? '').trim()
    if (!raw) {
      return FALLBACK_LOOK_IMAGES[idx % 4]
    }
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('blob:') || raw.startsWith('data:')) {
      return raw
    }
    const base = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbaszjtjhzgrarkbhvt.supabase.co'
    return `${base}/storage/v1/object/public/product-media/${raw}`
  }

  // Update a field on the active look
  const updateCurrentLook = (field: keyof LookItem, value: any) => {
    setLooks((prev) => {
      const next = [...prev]
      next[selectedIndex] = {
        ...next[selectedIndex],
        [field]: value
      }
      return next
    })
  }

  // Upload file (Image, GIF, Video MP4) to Supabase Storage
  async function handleFileUpload(file: File, targetField: 'mediaUrl' | 'videoUrl') {
    setStatusMessage('')
    setErrorMessage('')
    setUploading(targetField)

    // Instant local preview via Blob URL
    try {
      const objectUrl = URL.createObjectURL(file)
      setLocalPreviews((prev) => ({
        ...prev,
        [`${selectedIndex}-${targetField}`]: objectUrl
      }))
    } catch {
      // Fallback if URL.createObjectURL is not available
    }

    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadForm
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar archivo en el servidor.')
      }

      updateCurrentLook(targetField, data.url)
      setStatusMessage(`✓ ¡Archivo "${file.name}" cargado con éxito! Haz clic en "Guardar y Publicar en la Tienda" para aplicar.`)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar el archivo.')
    } finally {
      setUploading(null)
    }
  }

  // Save all looks to Supabase store_settings
  const handleSave = async () => {
    setStatusMessage('')
    setErrorMessage('')

    const formData = new FormData()
    // Populate existing settings
    Object.entries(allSettings).forEach(([key, val]) => {
      if (key !== 'shop_looks' && key !== 'instagram_url') {
        formData.set(key, String(val ?? ''))
      }
    })
    // Serialize looks array as JSON and updated instagram URL
    formData.set('shop_looks', JSON.stringify(looks))
    formData.set('instagram_url', instagramUrl.trim())

    startTransition(async () => {
      try {
        await saveStoreSettings(formData)
        setStatusMessage('✓ ¡Tarjetas guardadas y publicadas en la tienda! Los cambios ya están en vivo.')
        router.refresh()
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error al guardar los cambios.')
      }
    })
  }

  const liveMediaBlob = localPreviews[`${selectedIndex}-mediaUrl`]
  const liveVideoBlob = localPreviews[`${selectedIndex}-videoUrl`]

  const resolvedMedia = liveMediaBlob || resolveMediaUrl(currentLook.mediaUrl, selectedIndex)
  const resolvedVideo = liveVideoBlob || (currentLook.videoUrl ? resolveMediaUrl(currentLook.videoUrl, selectedIndex) : '')
  const isVideo = currentLook.mediaType === 'video' && Boolean(resolvedVideo)
  const isGif = resolvedMedia.toLowerCase().includes('.gif')

  return (
    <div className="looks-manager-wrap">
      {statusMessage && (
        <div className="admin-alert admin-alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>{statusMessage}</span>
          <a
            href={`/?t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 14px',
              background: '#ffffff',
              color: 'var(--wine)',
              border: '1px solid rgba(85,30,48,0.2)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}
          >
            Abrir tienda en vivo actualizada ↗
          </a>
        </div>
      )}
      {errorMessage && <div className="admin-alert admin-alert-danger">{errorMessage}</div>}

      {/* Recommended Sizing & Export Guide Banner */}
      <div className="admin-guidance-card">
        <div className="guidance-header">
          <span className="guidance-icon">📐</span>
          <h3>Guía de Medidas y Formatos Recomendados</h3>
        </div>
        <div className="guidance-grid">
          <div className="guidance-item">
            <strong>Proporción / Aspect Ratio</strong>
            <p><strong>4 : 5</strong> (Vertical estilo Instagram / Joyería)</p>
          </div>
          <div className="guidance-item">
            <strong>Fotografías y GIFs</strong>
            <p><strong>1080 × 1350 px</strong> (óptimo) o <strong>800 × 1000 px</strong> (JPG, PNG, WebP o GIF)</p>
          </div>
          <div className="guidance-item">
            <strong>Video Reels (MP4)</strong>
            <p><strong>1080 × 1350 px</strong> o <strong>1080 × 1920 px</strong> (MP4 H.264, 4 a 15s en bucle, &lt; 10 MB)</p>
          </div>
          <div className="guidance-item">
            <strong>Consejo comercial</strong>
            <p>Encuadre centrado en la pieza puesta (aretes, cuello, manos o caja de regalo).</p>
          </div>
        </div>
      </div>

      {/* Tabs to select which card to edit */}
      <div className="looks-tabs-bar">
        {looks.map((look, idx) => (
          <button
            key={look.id || idx}
            type="button"
            className={`looks-tab-btn ${selectedIndex === idx ? 'active' : ''}`}
            onClick={() => setSelectedIndex(idx)}
          >
            <span className="tab-number">Look #{idx + 1}</span>
            <strong className="tab-title">{look.title || `Tarjeta ${idx + 1}`}</strong>
            <small className="tab-badge">{look.badge}</small>
          </button>
        ))}
      </div>

      <div className="hero-editor-grid">
        {/* Left Column: Form Editor for Selected Look */}
        <div className="hero-config-column">
          <div className="product-form">
            <h2>Configuración del Look #{selectedIndex + 1}</h2>

            {/* Media Type Selector */}
            <div className="field-group">
              <label>Formato de Medio</label>
              <div className="media-type-selector">
                <button
                  type="button"
                  className={`media-type-btn ${currentLook.mediaType === 'image' ? 'active' : ''}`}
                  onClick={() => updateCurrentLook('mediaType', 'image')}
                >
                  📷 Foto o GIF Animado
                </button>
                <button
                  type="button"
                  className={`media-type-btn ${currentLook.mediaType === 'video' ? 'active' : ''}`}
                  onClick={() => updateCurrentLook('mediaType', 'video')}
                >
                  🎥 Video Reel en Bucle (MP4)
                </button>
              </div>
            </div>

            {/* Upload or URL for Image / GIF */}
            <div className="field-group" style={{ background: '#faf6f4', padding: '16px', borderRadius: '6px' }}>
              <label>
                {currentLook.mediaType === 'video' ? 'Imagen de Portada (Poster del Video)' : 'Subir Fotografía o GIF Animado'}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'mediaUrl')
                }}
                disabled={uploading !== null}
              />
              {uploading === 'mediaUrl' && <p className="help-text">Subiendo a Supabase Storage...</p>}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#777' }}>Ruta actual o URL:</span>
                <input
                  type="text"
                  value={currentLook.mediaUrl}
                  onChange={(e) => updateCurrentLook('mediaUrl', e.target.value)}
                  placeholder="/looks/look-1-aretes.jpg"
                />
              </div>
            </div>

            {/* Video MP4 Upload (if mediaType is video) */}
            {currentLook.mediaType === 'video' && (
              <div className="field-group" style={{ background: '#f5f0f3', padding: '16px', borderRadius: '6px' }}>
                <label>Subir Video MP4 o WebM (Reel en bucle)</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'videoUrl')
                  }}
                  disabled={uploading !== null}
                />
                {uploading === 'videoUrl' && <p className="help-text">Subiendo video a Supabase Storage...</p>}
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#777' }}>Ruta de video o URL:</span>
                  <input
                    type="text"
                    value={currentLook.videoUrl || ''}
                    onChange={(e) => updateCurrentLook('videoUrl', e.target.value)}
                    placeholder="https://.../video.mp4"
                  />
                </div>
              </div>
            )}

            {/* Badges & Prices */}
            <div className="field-row">
              <div className="field-group">
                <label>Insignia Superior (Badge)</label>
                <input
                  type="text"
                  value={currentLook.badge}
                  onChange={(e) => updateCurrentLook('badge', e.target.value)}
                  placeholder="✦ BEST SELLER"
                />
              </div>
              <div className="field-group">
                <label>Indicador de Precio / Oferta</label>
                <input
                  type="text"
                  value={currentLook.priceHint || ''}
                  onChange={(e) => updateCurrentLook('priceHint', e.target.value)}
                  placeholder="Desde $390 MXN"
                />
              </div>
            </div>

            {/* Commercial Texts */}
            <div className="field-group">
              <label>Título del Accesorio o Look</label>
              <input
                type="text"
                value={currentLook.title}
                onChange={(e) => updateCurrentLook('title', e.target.value)}
                placeholder="Aretes Duna & Aros Oro"
              />
            </div>

            <div className="field-group">
              <label>Descripción / Mensaje Comercial</label>
              <textarea
                rows={2}
                value={currentLook.subtitle}
                onChange={(e) => updateCurrentLook('subtitle', e.target.value)}
                placeholder="El toque sutil de luminosidad que eleva cualquier outfit casual o formal."
              />
            </div>

            {/* Button Actions */}
            <div className="field-row">
              <div className="field-group">
                <label>Texto del Botón</label>
                <input
                  type="text"
                  value={currentLook.ctaText}
                  onChange={(e) => updateCurrentLook('ctaText', e.target.value)}
                  placeholder="Comprar aretes ↗"
                />
              </div>
              <div className="field-group">
                <label>Enlace de Destino</label>
                <input
                  type="text"
                  value={currentLook.ctaUrl}
                  onChange={(e) => updateCurrentLook('ctaUrl', e.target.value)}
                  placeholder="#productos o /productos/slug"
                />
              </div>
            </div>

            {/* Instagram Link Configuration */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#faf7f2', borderRadius: '10px', border: '1px solid #e8dfd5' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#7a6858', textTransform: 'uppercase', marginBottom: '6px' }}>
                Cuenta de Instagram vinculada (Botón de redes en tienda)
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/erika_maison_ags/"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d4c5b5', fontSize: '14px', background: '#fff' }}
              />
              <div style={{ fontSize: '12px', color: '#8c7b6d', marginTop: '6px' }}>
                En la tienda se mostrará: <strong>Instagram {getInstagramHandle(instagramUrl)} ↗</strong>
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={isPending || uploading !== null}
              >
                {isPending ? 'Guardando en la tienda...' : 'Guardar y Publicar en la Tienda'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview */}
        <div className="hero-preview-column">
          <div className="preview-label">PREVISUALIZACIÓN EN TIEMPO REAL</div>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
            Así se verá la tarjeta #{selectedIndex + 1} exactamente en la tienda:
          </p>

          <div style={{ maxWidth: '340px', margin: '0 auto' }}>
            <article className="lookbook-card">
              <div className="lookbook-media-container">
                {isVideo && resolvedVideo ? (
                  <video
                    key={resolvedVideo}
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
                    key={resolvedMedia}
                    className="lookbook-media"
                    src={resolvedMedia || FALLBACK_LOOK_IMAGES[selectedIndex % 4]}
                    alt={currentLook.title || 'Maison Erika Look'}
                  />
                )}

                <div className="lookbook-overlay" />

                <div className="lookbook-top-bar">
                  <span className="lookbook-badge">{currentLook.badge}</span>
                  {isVideo && <span className="lookbook-reel-indicator">▶ Video Reel</span>}
                  {isGif && !isVideo && <span className="lookbook-reel-indicator">GIF</span>}
                </div>

                <div className="lookbook-content">
                  {currentLook.priceHint && (
                    <div className="lookbook-price-hint">{currentLook.priceHint}</div>
                  )}
                  <h3 className="lookbook-title">{currentLook.title}</h3>
                  <p className="lookbook-subtitle">{currentLook.subtitle}</p>

                  <div className="lookbook-cta-btn">
                    <span>{currentLook.ctaText || 'Comprar este look ↗'}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
