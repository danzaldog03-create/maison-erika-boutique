'use client'

import React, { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StoreSettings } from '@/lib/settings'
import { saveStoreSettings } from '@/lib/admin/actions'

export function HeroManager({
  initialSettings,
  supabaseUrl
}: {
  initialSettings: StoreSettings
  supabaseUrl: string
}) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings)
  const [busy, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)

  const resolveMediaUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path
    }
    return `${supabaseUrl}/storage/v1/object/public/product-media/${path}`
  }

  // Helper to upload files to Supabase Storage 'product-media/hero/'
  async function handleFileUpload(file: File, targetField: 'hero_image_path' | 'hero_video_path' | 'hero_video_poster_path') {
    setStatusMessage('')
    setErrorMessage('')
    setUploading(targetField)

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

      setSettings((prev) => ({
        ...prev,
        [targetField]: data.url
      }))
      setStatusMessage('✓ Archivo subido con éxito al servidor. Recuerda guardar los cambios.')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar el archivo.')
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage('')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    // Ensure all current settings fields exist in form
    formData.set('hero_is_active', settings.hero_is_active ? 'true' : 'false')
    formData.set('hero_media_type', settings.hero_media_type)
    formData.set('hero_image_path', settings.hero_image_path)
    formData.set('hero_video_path', settings.hero_video_path)
    formData.set('hero_video_poster_path', settings.hero_video_poster_path)
    formData.set('hero_eyebrow', settings.hero_eyebrow)
    formData.set('hero_title', settings.hero_title)
    formData.set('hero_subtitle', settings.hero_subtitle)
    formData.set('hero_button_text', settings.hero_button_text)
    formData.set('hero_button_url', settings.hero_button_url)

    // Preserve other store settings
    formData.set('whatsapp_number', initialSettings.whatsapp_number)
    formData.set('whatsapp_message', initialSettings.whatsapp_message)
    formData.set('bank_name', initialSettings.bank_name)
    formData.set('bank_beneficiary', initialSettings.bank_beneficiary)
    formData.set('bank_clabe', initialSettings.bank_clabe)
    formData.set('bank_account', initialSettings.bank_account)
    formData.set('bank_instructions', initialSettings.bank_instructions)
    formData.set('shipping_flat_rate', String(initialSettings.shipping_flat_rate))
    formData.set('free_shipping_threshold', String(initialSettings.free_shipping_threshold))
    formData.set('shipping_estimated_days', initialSettings.shipping_estimated_days)
    formData.set('instagram_url', initialSettings.instagram_url)
    formData.set('facebook_url', initialSettings.facebook_url)
    formData.set('tiktok_url', initialSettings.tiktok_url)
    formData.set('announcement_text', initialSettings.announcement_text)
    formData.set('story_title', initialSettings.story_title)
    formData.set('story_content', initialSettings.story_content)
    formData.set('contact_email', initialSettings.contact_email)

    startTransition(async () => {
      try {
        await saveStoreSettings(formData)
        setStatusMessage('¡Configuración del Hero guardada y publicada en la tienda!')
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error al guardar la configuración.')
      }
    })
  }

  const previewImageUrl = resolveMediaUrl(settings.hero_image_path || '/hero/editorial-jewelry-hero.jpg')
  const previewVideoUrl = resolveMediaUrl(settings.hero_video_path)
  const previewPosterUrl = resolveMediaUrl(settings.hero_video_poster_path || '/hero/editorial-poster.jpg')

  return (
    <div className="hero-manager-wrap">
      {statusMessage && <div className="admin-alert admin-alert-success">{statusMessage}</div>}
      {errorMessage && <div className="admin-alert admin-alert-danger">{errorMessage}</div>}

      <div className="hero-editor-grid">
        {/* Left: Configuration Form */}
        <div className="hero-config-column">
          <form onSubmit={handleSubmit} className="product-form">
            {/* Visibility Toggle */}
            <div className="catalog-form-card">
              <div className="form-toggle-row">
                <div>
                  <strong>Estado del Hero en la Tienda</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                    {settings.hero_is_active ? 'Visible en portada' : 'Oculto (no se mostrará a los visitantes)'}
                  </p>
                </div>
                <button
                  type="button"
                  className={`pill ${settings.hero_is_active ? 'status-active' : 'status-draft'}`}
                  onClick={() => setSettings((s) => ({ ...s, hero_is_active: !s.hero_is_active }))}
                >
                  {settings.hero_is_active ? 'Activo (Visible)' : 'Inactivo (Pausado)'}
                </button>
              </div>
            </div>

            {/* Media Type & Upload */}
            <div className="catalog-form-card">
              <h2>Formato de Medios (Foto o Video)</h2>
              <div className="media-type-selector">
                <button
                  type="button"
                  className={`media-type-pill ${settings.hero_media_type === 'image' ? 'active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, hero_media_type: 'image' }))}
                >
                  📷 Fotografía de Campaña
                </button>
                <button
                  type="button"
                  className={`media-type-pill ${settings.hero_media_type === 'video' ? 'active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, hero_media_type: 'video' }))}
                >
                  🎬 Video MP4 en Bucle
                </button>
              </div>

              {settings.hero_media_type === 'image' ? (
                <div className="media-upload-box">
                  <label>
                    Subir nueva Fotografía (JPG, PNG, WebP)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'hero_image_path')
                      }}
                    />
                  </label>
                  {uploading === 'hero_image_path' && <p className="uploading-hint">Subiendo fotografía a Supabase...</p>}
                  <label style={{ marginTop: '10px' }}>
                    O ruta / URL de imagen:
                    <input
                      value={settings.hero_image_path}
                      onChange={(e) => setSettings((s) => ({ ...s, hero_image_path: e.target.value }))}
                      placeholder="/hero/editorial-jewelry-hero.jpg"
                    />
                  </label>
                </div>
              ) : (
                <div className="media-upload-box">
                  <label>
                    Subir Video MP4 (máx. 25 MB)
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'hero_video_path')
                      }}
                    />
                  </label>
                  {uploading === 'hero_video_path' && <p className="uploading-hint">Subiendo video a Supabase...</p>}

                  <label style={{ marginTop: '10px' }}>
                    O URL del Video MP4:
                    <input
                      value={settings.hero_video_path}
                      onChange={(e) => setSettings((s) => ({ ...s, hero_video_path: e.target.value }))}
                      placeholder="https://... o ruta en product-media"
                    />
                  </label>

                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                    <label>
                      Imagen de portada / Poster (para precarga del video):
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'hero_video_poster_path')
                        }}
                      />
                    </label>
                    {uploading === 'hero_video_poster_path' && <p className="uploading-hint">Subiendo poster...</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Editorial Texts */}
            <div className="catalog-form-card">
              <h2>Textos Comerciales</h2>
              <label>
                Cintillo superior (Eyebrow)
                <input
                  value={settings.hero_eyebrow}
                  onChange={(e) => setSettings((s) => ({ ...s, hero_eyebrow: e.target.value }))}
                  placeholder="A LITTLE WORLD OF BEAUTY"
                />
              </label>

              <label>
                Título principal
                <input
                  value={settings.hero_title}
                  onChange={(e) => setSettings((s) => ({ ...s, hero_title: e.target.value }))}
                  placeholder="Pequeños tesoros, grandes detalles."
                />
              </label>

              <label>
                Subtítulo / Mensaje de marca
                <textarea
                  rows={3}
                  value={settings.hero_subtitle}
                  onChange={(e) => setSettings((s) => ({ ...s, hero_subtitle: e.target.value }))}
                  placeholder="Accesorios seleccionados para acompañarte y hacer especial cada momento."
                />
              </label>

              <div className="form-two">
                <label>
                  Texto del botón principal
                  <input
                    value={settings.hero_button_text}
                    onChange={(e) => setSettings((s) => ({ ...s, hero_button_text: e.target.value }))}
                    placeholder="Descubrir colección"
                  />
                </label>
                <label>
                  Enlace del botón
                  <input
                    value={settings.hero_button_url}
                    onChange={(e) => setSettings((s) => ({ ...s, hero_button_url: e.target.value }))}
                    placeholder="#productos"
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="primary admin-submit" disabled={busy || uploading !== null}>
              {busy ? 'PUBLICANDO CAMBIOS...' : 'PUBLICAR EN LA TIENDA ↗'}
            </button>
          </form>
        </div>

        {/* Right: Live Interactive Preview */}
        <div className="hero-preview-column">
          <div className="hero-preview-sticky">
            <div className="preview-header">
              <span className="eyebrow">PREVISUALIZACIÓN EN TIEMPO REAL</span>
              <h3>Así se verá en la portada</h3>
            </div>

            <div className="editorial-hero-preview-box">
              <div className="editorial-hero" style={{ margin: 0, width: '100%' }}>
                <div className="editorial-hero-container" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
                  {/* Copy preview */}
                  <div className="editorial-hero-copy" style={{ padding: '24px 20px' }}>
                    <div className="editorial-eyebrow-row">
                      <span className="editorial-eyebrow-dot">✦</span>
                      <span className="editorial-eyebrow">{settings.hero_eyebrow}</span>
                    </div>

                    <h1 className="editorial-hero-title" style={{ fontSize: '28px' }}>
                      {settings.hero_title.split(',')[0]}
                      {settings.hero_title.includes(',') && (
                        <>
                          ,<br />
                          <em>{settings.hero_title.split(',').slice(1).join(',')}</em>
                        </>
                      )}
                    </h1>

                    <p className="editorial-hero-lead" style={{ fontSize: '12px' }}>
                      {settings.hero_subtitle}
                    </p>

                    <div className="editorial-hero-actions">
                      <span className="primary editorial-cta-btn" style={{ padding: '10px 18px', fontSize: '10px' }}>
                        {settings.hero_button_text || 'Descubrir colección'} ↗
                      </span>
                    </div>
                  </div>

                  {/* Media preview */}
                  <div className="editorial-hero-media-wrap">
                    <div className="editorial-media-card" style={{ maxHeight: '360px' }}>
                      {settings.hero_media_type === 'video' && previewVideoUrl ? (
                        <video
                          className="editorial-media-element"
                          autoPlay
                          muted
                          loop
                          playsInline
                          poster={previewPosterUrl}
                          src={previewVideoUrl}
                        />
                      ) : (
                        <img
                          src={previewImageUrl}
                          alt="Previsualización"
                          className="editorial-media-element"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
