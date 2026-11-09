'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createProduct,
  updateProduct,
  setProductStatus,
  archiveProduct,
  setPrimaryProductImage,
  deleteProductImage,
  addProductVariant,
  updateVariantStock
} from '@/lib/admin/actions'

export interface AdminCategory {
  id: string
  name: string
  is_active: boolean
}

export interface AdminProductImage {
  id: string
  storage_path: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export interface AdminProductVariant {
  id: string
  name: string
  sku: string | null
  stock_quantity: number
  price_override: number | null
  is_active: boolean
}

export interface AdminProduct {
  id: string
  name: string
  sku: string | null
  price: number
  compare_at_price: number | null
  material: string | null
  short_description: string | null
  description: string | null
  status: 'draft' | 'active' | 'archived'
  category_id: string
  created_at: string
  product_images?: AdminProductImage[]
  product_variants?: AdminProductVariant[]
}

export function ProductManager({
  products: initialProducts,
  categories,
  supabaseUrl
}: {
  products: AdminProduct[]
  categories: AdminCategory[]
  supabaseUrl: string
}) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [message, setMessage] = useState('')
  const [errorBanner, setErrorBanner] = useState('')
  const [busy, startTransition] = useTransition()

  // Selected product for modals
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [managingPhotosProduct, setManagingPhotosProduct] = useState<AdminProduct | null>(null)
  const [managingVariantsProduct, setManagingVariantsProduct] = useState<AdminProduct | null>(null)

  const activeCategories = categories.filter((c) => c.is_active)
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q))
      return matchesStatus && matchesQuery
    })
  }, [products, statusFilter, query])

  const imageUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/product-media/${path}`

  // -------------------------------------------------------------
  // Image Upload helper
  // -------------------------------------------------------------
  async function uploadImageFile(productId: string, file: File, isPrimary = false) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG, WebP o AVIF.')
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen supera el límite de 5 MB.')
    }

    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${productId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      if (uploadError.message.includes('row-level security') || uploadError.message.includes('row-level')) {
        throw new Error('Permisos de almacenamiento pendientes en Supabase: Aplica el script SQL de permisos para el bucket "product-media" en el panel de Supabase.')
      }
      throw new Error(`Error al subir archivo: ${uploadError.message}`)
    }

    const { data: newImage, error: rowError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: path,
        alt_text: file.name.replace(/\.[^.]+$/, ''),
        is_primary: isPrimary,
        sort_order: 10
      })
      .select('id, storage_path, alt_text, is_primary, sort_order')
      .single()

    if (rowError) {
      await supabase.storage.from('product-media').remove([path])
      throw new Error(`Error al registrar imagen: ${rowError.message}`)
    }

    return newImage
  }

  // -------------------------------------------------------------
  // CREATE PRODUCT
  // -------------------------------------------------------------
  async function handleCreate(formData: FormData) {
    setMessage('')
    setErrorBanner('')
    const imageFile = formData.get('image') as File | null
    formData.delete('image')

    try {
      const res = await createProduct(formData)
      if (res?.id && imageFile && imageFile.size > 0) {
        await uploadImageFile(res.id, imageFile, true)
      }
      window.location.reload()
    } catch (e: any) {
      setErrorBanner(e?.message || 'Error al guardar producto.')
    }
  }

  // -------------------------------------------------------------
  // EDIT PRODUCT
  // -------------------------------------------------------------
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingProduct) return
    setMessage('')
    setErrorBanner('')

    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateProduct(editingProduct.id, form)
        setMessage(`Producto "${editingProduct.name}" actualizado correctamente.`)
        setEditingProduct(null)
        window.location.reload()
      } catch (err: any) {
        setErrorBanner(err?.message || 'No se pudo actualizar el producto.')
      }
    })
  }

  // -------------------------------------------------------------
  // STATUS / SOFT DELETE
  // -------------------------------------------------------------
  async function handleChangeStatus(p: AdminProduct, newStatus: 'draft' | 'active' | 'archived') {
    startTransition(async () => {
      try {
        await setProductStatus(p.id, newStatus)
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, status: newStatus } : item)))
        setMessage(`Estado de "${p.name}" actualizado a ${newStatus}.`)
      } catch (err: any) {
        setErrorBanner(err?.message || 'Error al cambiar estado.')
      }
    })
  }

  async function handleArchive(p: AdminProduct) {
    if (!confirm(`¿Dar de baja lógica al producto "${p.name}"? Pasará al archivo y no será visible en la boutique.`)) {
      return
    }
    startTransition(async () => {
      try {
        await archiveProduct(p.id)
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, status: 'archived' } : item)))
        setMessage(`"${p.name}" archivado correctamente (Baja lógica).`)
      } catch (err: any) {
        setErrorBanner(err?.message || 'Error al archivar.')
      }
    })
  }

  // -------------------------------------------------------------
  // PHOTO MODAL ACTIONS
  // -------------------------------------------------------------
  async function handleUploadAdditionalPhoto(file: File) {
    if (!managingPhotosProduct) return
    setErrorBanner('')
    try {
      const hasImages = (managingPhotosProduct.product_images?.length ?? 0) > 0
      const newImg = await uploadImageFile(managingPhotosProduct.id, file, !hasImages)
      setManagingPhotosProduct((prev) =>
        prev
          ? {
              ...prev,
              product_images: [...(prev.product_images || []), newImg]
            }
          : null
      )
      setMessage('Fotografía agregada con éxito.')
    } catch (e: any) {
      setErrorBanner(e?.message || 'Error al subir foto.')
    }
  }

  async function handleSetPrimaryPhoto(imgId: string) {
    if (!managingPhotosProduct) return
    startTransition(async () => {
      try {
        await setPrimaryProductImage(managingPhotosProduct.id, imgId)
        setManagingPhotosProduct((prev) =>
          prev
            ? {
                ...prev,
                product_images: (prev.product_images || []).map((img) => ({
                  ...img,
                  is_primary: img.id === imgId
                }))
              }
            : null
        )
        setMessage('Fotografía principal actualizada.')
      } catch (e: any) {
        setErrorBanner(e?.message || 'Error al asignar foto principal.')
      }
    })
  }

  async function handleDeletePhoto(imgId: string, path: string) {
    if (!managingPhotosProduct) return
    if (!confirm('¿Eliminar esta fotografía?')) return
    startTransition(async () => {
      try {
        await deleteProductImage(managingPhotosProduct.id, imgId, path)
        setManagingPhotosProduct((prev) =>
          prev
            ? {
                ...prev,
                product_images: (prev.product_images || []).filter((img) => img.id !== imgId)
              }
            : null
        )
        setMessage('Fotografía eliminada.')
      } catch (e: any) {
        setErrorBanner(e?.message || 'Error al eliminar foto.')
      }
    })
  }

  // -------------------------------------------------------------
  // VARIANT & INVENTORY MODAL ACTIONS
  // -------------------------------------------------------------
  async function handleAddVariant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!managingVariantsProduct) return
    setErrorBanner('')

    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '')
    const sku = String(form.get('sku') ?? '')
    const stock = Number(form.get('stock') ?? 0)
    const priceOverride = form.get('price_override') ? Number(form.get('price_override')) : null

    startTransition(async () => {
      try {
        await addProductVariant(managingVariantsProduct.id, name, sku, stock, priceOverride)
        setMessage(`Variante "${name}" creada.`)
        window.location.reload()
      } catch (err: any) {
        setErrorBanner(err?.message || 'Error al crear variante.')
      }
    })
  }

  async function handleStockUpdate(variantId: string, newStock: number) {
    startTransition(async () => {
      try {
        await updateVariantStock(variantId, newStock)
        setMessage('Existencias actualizadas.')
        window.location.reload()
      } catch (err: any) {
        setErrorBanner(err?.message || 'Error al actualizar inventario.')
      }
    })
  }

  return (
    <div className="admin-catalog-container">
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {errorBanner && <div className="admin-alert admin-alert-danger">{errorBanner}</div>}

      <div className="catalog-layout">
        {/* CREATE PRODUCT FORM */}
        <section className="catalog-form-card">
          <div className="eyebrow">NUEVA PIEZA</div>
          <h2>Agregar producto</h2>
          <form action={handleCreate} className="product-form">
            <label>
              Nombre del producto *
              <input name="name" required placeholder="Ej. Aretes Perla y Circonia" />
            </label>

            <label>
              Colección / Categoría *
              <select name="category_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-two">
              <label>
                Precio (MXN) *
                <input name="price" type="number" min="0" step="0.01" required placeholder="399.00" />
              </label>
              <label>
                Precio comparativo
                <input name="compare_at_price" type="number" min="0" step="0.01" placeholder="499.00" />
              </label>
            </div>

            <div className="form-two">
              <label>
                Existencias iniciales *
                <input name="stock" type="number" min="0" step="1" defaultValue="1" required />
              </label>
              <label>
                SKU (opcional)
                <input name="sku" placeholder="ME-ARE-001" />
              </label>
            </div>

            <label>
              Material
              <input name="material" placeholder="Acero inoxidable con chapa de oro 18k, perlas de río..." />
            </label>

            <label>
              Descripción corta
              <input
                name="short_description"
                maxLength={180}
                placeholder="Un detalle delicado para acompañarte todos los días."
              />
            </label>

            <label>
              Descripción detallada
              <textarea
                name="description"
                rows={3}
                placeholder="Medidas, cuidados especiales y detalles de fabricación..."
              />
            </label>

            <label>
              Fotografía principal
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
              />
            </label>

            <label>
              Visibilidad inicial
              <select name="status" defaultValue="draft">
                <option value="draft">Borrador (no visible en tienda)</option>
                <option value="active">Publicado inmediatamente</option>
              </select>
            </label>

            <button className="primary admin-submit" disabled={busy}>
              {busy ? 'GUARDANDO...' : 'GUARDAR PRODUCTO ↗'}
            </button>
          </form>
          <p className="form-hint">
            La primera variante se crea automáticamente como “Única”. Puedes agregar más fotos, colores o tallas una vez creado.
          </p>
        </section>

        {/* PRODUCTS LIST & MANAGEMENT */}
        <section className="catalog-list-card">
          <div className="catalog-list-head">
            <div>
              <div className="eyebrow">CONTROL DE INVENTARIO</div>
              <h2>Catálogo ({filtered.length} de {products.length})</h2>
            </div>
            <div className="catalog-filters-row">
              <input
                aria-label="Buscar producto o SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU, material..."
              />
              <div className="admin-status-tabs">
                <button
                  type="button"
                  className={statusFilter === 'all' ? 'active' : ''}
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={statusFilter === 'active' ? 'active' : ''}
                  onClick={() => setStatusFilter('active')}
                >
                  Publicados
                </button>
                <button
                  type="button"
                  className={statusFilter === 'draft' ? 'active' : ''}
                  onClick={() => setStatusFilter('draft')}
                >
                  Borradores
                </button>
                <button
                  type="button"
                  className={statusFilter === 'archived' ? 'active' : ''}
                  onClick={() => setStatusFilter('archived')}
                >
                  Archivados
                </button>
              </div>
            </div>
          </div>

          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th>Colección</th>
                  <th>Precio</th>
                  <th>Existencias</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const primaryImg = p.product_images?.find((img) => img.is_primary) ?? p.product_images?.[0]
                  const totalStock = (p.product_variants ?? []).reduce(
                    (sum, v) => sum + (v.stock_quantity ?? 0),
                    0
                  )

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product-cell">
                          {primaryImg ? (
                            <img
                              src={imageUrl(primaryImg.storage_path)}
                              alt={p.name}
                              className="table-product-thumb"
                            />
                          ) : (
                            <span className="table-product-placeholder">✧</span>
                          )}
                          <div>
                            <strong>{p.name}</strong>
                            <small>{p.sku ? `SKU: ${p.sku}` : 'Sin SKU'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-category-tag">
                          {categoryMap.get(p.category_id) || 'General'}
                        </span>
                      </td>
                      <td>
                        <strong>${Number(p.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                        {p.compare_at_price && (
                          <small style={{ textDecoration: 'line-through', color: 'var(--muted)' }}>
                            ${Number(p.compare_at_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </small>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-stock-btn"
                          onClick={() => setManagingVariantsProduct(p)}
                          title="Gestionar existencias y variantes"
                        >
                          <span className={totalStock > 0 ? 'stock-ok' : 'stock-out'}>
                            {totalStock} unid.
                          </span>
                        </button>
                      </td>
                      <td>
                        <select
                          aria-label={`Cambiar visibilidad de ${p.name}`}
                          value={p.status}
                          disabled={busy}
                          onChange={(e) => handleChangeStatus(p, e.target.value as any)}
                        >
                          <option value="draft">Borrador</option>
                          <option value="active">Publicado</option>
                          <option value="archived">Archivado</option>
                        </select>
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="table-action-icon"
                            onClick={() => setEditingProduct(p)}
                            title="Editar datos de producto"
                          >
                            ✎ Editar
                          </button>
                          <button
                            type="button"
                            className="table-action-icon"
                            onClick={() => setManagingPhotosProduct(p)}
                            title="Administrar fotografías"
                          >
                            📷 Fotos ({(p.product_images ?? []).length})
                          </button>
                          {p.status !== 'archived' && (
                            <button
                              type="button"
                              className="table-action-icon table-action-danger"
                              onClick={() => handleArchive(p)}
                              title="Baja lógica (Archivar)"
                            >
                              ✕ Archivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '35px' }}>
                      No hay productos que coincidan con el criterio seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT PRODUCT */}
      {/* ------------------------------------------------------------- */}
      {editingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Editar pieza: {editingProduct.name}</h2>
              <button className="admin-modal-close" onClick={() => setEditingProduct(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="product-form">
              <label>
                Nombre del producto *
                <input name="name" required defaultValue={editingProduct.name} />
              </label>

              <label>
                Colección / Categoría *
                <select name="category_id" required defaultValue={editingProduct.category_id}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {!c.is_active && '(Inactiva)'}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-two">
                <label>
                  Precio (MXN) *
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingProduct.price}
                  />
                </label>
                <label>
                  Precio comparativo
                  <input
                    name="compare_at_price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingProduct.compare_at_price ?? ''}
                  />
                </label>
              </div>

              <div className="form-two">
                <label>
                  SKU
                  <input name="sku" defaultValue={editingProduct.sku ?? ''} />
                </label>
                <label>
                  Material
                  <input name="material" defaultValue={editingProduct.material ?? ''} />
                </label>
              </div>

              <label>
                Descripción corta
                <input
                  name="short_description"
                  maxLength={180}
                  defaultValue={editingProduct.short_description ?? ''}
                />
              </label>

              <label>
                Descripción completa
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={editingProduct.description ?? ''}
                />
              </label>

              <label>
                Estado / Visibilidad
                <select name="status" defaultValue={editingProduct.status}>
                  <option value="draft">Borrador (oculto en tienda)</option>
                  <option value="active">Publicado en la boutique</option>
                  <option value="archived">Archivado (baja lógica)</option>
                </select>
              </label>

              <div className="admin-modal-footer">
                <button type="button" className="pill" onClick={() => setEditingProduct(null)}>
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={busy}>
                  {busy ? 'GUARDANDO...' : 'GUARDAR CAMBIOS ↗'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PHOTO MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {managingPhotosProduct && (
        <div className="admin-modal-backdrop" onClick={() => setManagingPhotosProduct(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Fotografías de: {managingPhotosProduct.name}</h2>
              <button className="admin-modal-close" onClick={() => setManagingPhotosProduct(null)}>
                ✕
              </button>
            </div>

            <div className="photo-manager-grid">
              {(managingPhotosProduct.product_images || []).map((img) => (
                <div key={img.id} className={`photo-manager-card ${img.is_primary ? 'is-primary' : ''}`}>
                  <img src={imageUrl(img.storage_path)} alt="" />
                  <div className="photo-manager-actions">
                    {img.is_primary ? (
                      <span className="photo-primary-badge">★ Principal</span>
                    ) : (
                      <button
                        type="button"
                        className="photo-action-btn"
                        onClick={() => handleSetPrimaryPhoto(img.id)}
                      >
                        Hacer principal
                      </button>
                    )}
                    <button
                      type="button"
                      className="photo-action-btn photo-delete-btn"
                      onClick={() => handleDeletePhoto(img.id, img.storage_path)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="photo-upload-section">
              <h3>Subir nueva fotografía</h3>
              <p>Formatos permitidos: JPG, PNG, WebP o AVIF (máx. 5 MB).</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadAdditionalPhoto(file)
                }}
              />
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setManagingPhotosProduct(null)
                  window.location.reload()
                }}
              >
                LISTO / CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VARIANTS & INVENTORY MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {managingVariantsProduct && (
        <div className="admin-modal-backdrop" onClick={() => setManagingVariantsProduct(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Variantes e Inventario: {managingVariantsProduct.name}</h2>
              <button className="admin-modal-close" onClick={() => setManagingVariantsProduct(null)}>
                ✕
              </button>
            </div>

            <div className="variants-list-wrap">
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th>Opción / Talla</th>
                    <th>SKU</th>
                    <th>Precio personalizado</th>
                    <th>Existencias actuales</th>
                    <th>Actualizar stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(managingVariantsProduct.product_variants || []).map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong>
                      </td>
                      <td>{v.sku || '—'}</td>
                      <td>
                        {v.price_override != null
                          ? `$${Number(v.price_override).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : `Precio base ($${Number(managingVariantsProduct.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })})`}
                      </td>
                      <td>
                        <strong className={v.stock_quantity > 0 ? 'stock-ok' : 'stock-out'}>
                          {v.stock_quantity} pzas
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            style={{ width: '80px', padding: '6px' }}
                            defaultValue={v.stock_quantity}
                            id={`stock-input-${v.id}`}
                          />
                          <button
                            type="button"
                            className="pill"
                            onClick={() => {
                              const input = document.getElementById(
                                `stock-input-${v.id}`
                              ) as HTMLInputElement
                              if (input) handleStockUpdate(v.id, Number(input.value))
                            }}
                          >
                            Guardar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="add-variant-box">
              <h3>Agregar nueva variante</h3>
              <form onSubmit={handleAddVariant} className="form-fields">
                <div className="form-row-two">
                  <label>
                    Nombre de variante *
                    <input name="name" required placeholder="Ej. Talla CH, Color Rosa, 45 cm" />
                  </label>
                  <label>
                    SKU específico
                    <input name="sku" placeholder="ME-ARE-001-CH" />
                  </label>
                </div>
                <div className="form-row-two">
                  <label>
                    Existencias iniciales
                    <input name="stock" type="number" min="0" defaultValue="1" required />
                  </label>
                  <label>
                    Precio específico (opcional)
                    <input name="price_override" type="number" min="0" step="0.01" placeholder="Dejar vacío para usar precio base" />
                  </label>
                </div>
                <button type="submit" className="primary" disabled={busy}>
                  AGREGAR VARIANTE ↗
                </button>
              </form>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="pill"
                onClick={() => setManagingVariantsProduct(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
