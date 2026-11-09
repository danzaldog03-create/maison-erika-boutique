'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    throw new Error('No tienes permisos de administración.')
  }
  return { supabase, user, profile }
}

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// -------------------------------------------------------------
// PRODUCT CRUD & BAJA LÓGICA
// -------------------------------------------------------------

export async function createProduct(formData: FormData) {
  const { supabase, user } = await requireAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const category_id = String(formData.get('category_id') ?? '')
  const price = Number(formData.get('price'))
  const compare_at_price = formData.get('compare_at_price') ? Number(formData.get('compare_at_price')) : null
  const stock = Math.max(0, Math.floor(Number(formData.get('stock') ?? 0)))
  const sku = String(formData.get('sku') ?? '').trim() || null
  const short_description = String(formData.get('short_description') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const material = String(formData.get('material') ?? '').trim() || null
  const status = String(formData.get('status') ?? 'draft') === 'active' ? 'active' : 'draft'

  if (!name || !category_id || !Number.isFinite(price) || price < 0 || !Number.isSafeInteger(stock)) {
    throw new Error('Revisa nombre, categoría, precio y existencias.')
  }

  const { data: category } = await supabase.from('categories').select('id').eq('id', category_id).maybeSingle()
  if (!category) throw new Error('La categoría seleccionada no existe.')

  const slug = `${slugify(name)}-${Date.now().toString(36)}`

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      category_id,
      name,
      slug,
      sku,
      short_description,
      description,
      material,
      price,
      compare_at_price,
      status,
      published_at: status === 'active' ? new Date().toISOString() : null,
      track_inventory: true
    })
    .select('id')
    .single()

  if (error || !product) throw new Error(error?.message ?? 'No se pudo crear el producto.')

  // Create initial variant 'Única'
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .insert({
      product_id: product.id,
      name: 'Única',
      sku,
      stock_quantity: stock,
      is_active: true
    })
    .select('id')
    .single()

  if (variantError) throw new Error(`Producto creado, pero falló la variante: ${variantError.message}`)

  if (stock > 0 && variant) {
    await supabase.from('inventory_movements').insert({
      variant_id: variant.id,
      movement_type: 'initial',
      quantity_change: stock,
      note: 'Existencia inicial al crear el producto en Maison Erika Studio',
      created_by: user.id
    })
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  return { id: product.id }
}

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const category_id = String(formData.get('category_id') ?? '')
  const price = Number(formData.get('price'))
  const compare_at_price = formData.get('compare_at_price') ? Number(formData.get('compare_at_price')) : null
  const sku = String(formData.get('sku') ?? '').trim() || null
  const short_description = String(formData.get('short_description') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const material = String(formData.get('material') ?? '').trim() || null
  const status = String(formData.get('status') ?? 'draft') as 'draft' | 'active' | 'archived'

  if (!name || !category_id || !Number.isFinite(price) || price < 0) {
    throw new Error('Revisa nombre, categoría y precio.')
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      category_id,
      price,
      compare_at_price,
      sku,
      short_description,
      description,
      material,
      status,
      published_at: status === 'active' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath(`/productos`)
  return { success: true }
}

export async function setProductStatus(id: string, status: 'draft' | 'active' | 'archived') {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('products')
    .update({
      status,
      published_at: status === 'active' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  return { success: true }
}

// Baja lógica: archivar el producto para que no aparezca en la tienda sin romper pedidos históricos
export async function archiveProduct(id: string) {
  return setProductStatus(id, 'archived')
}

// -------------------------------------------------------------
// PHOTO MANAGEMENT
// -------------------------------------------------------------

export async function setPrimaryProductImage(productId: string, imageId: string) {
  const { supabase } = await requireAdmin()

  // Set all to false first
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  // Set selected to true
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/products')
  return { success: true }
}

export async function deleteProductImage(productId: string, imageId: string, storagePath: string) {
  const { supabase } = await requireAdmin()

  // Remove row from DB
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (dbError) throw new Error(dbError.message)

  // Remove file from Supabase Storage
  if (storagePath) {
    await supabase.storage.from('product-media').remove([storagePath])
  }

  // Ensure there is still a primary image
  const { data: remaining } = await supabase
    .from('product_images')
    .select('id, is_primary')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (remaining && remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
    await supabase.from('product_images').update({ is_primary: true }).eq('id', remaining[0].id)
  }

  revalidatePath('/')
  revalidatePath('/admin/products')
  return { success: true }
}

// -------------------------------------------------------------
// VARIANTS & INVENTORY
// -------------------------------------------------------------

export async function addProductVariant(
  productId: string,
  name: string,
  sku: string | null,
  stock: number,
  priceOverride: number | null
) {
  const { supabase, user } = await requireAdmin()

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('El nombre de la variante es obligatorio.')

  const validStock = Math.max(0, Math.floor(stock))

  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      name: trimmedName,
      sku: sku?.trim() || null,
      stock_quantity: validStock,
      price_override: priceOverride,
      is_active: true
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  if (validStock > 0 && variant) {
    await supabase.from('inventory_movements').insert({
      variant_id: variant.id,
      movement_type: 'initial',
      quantity_change: validStock,
      note: `Variante "${trimmedName}" creada`,
      created_by: user.id
    })
  }

  revalidatePath('/')
  revalidatePath('/admin/products')
  return { success: true }
}

export async function updateVariantStock(variantId: string, newStock: number, note?: string) {
  const { supabase, user } = await requireAdmin()

  const validStock = Math.max(0, Math.floor(newStock))

  const { data: current } = await supabase
    .from('product_variants')
    .select('stock_quantity')
    .eq('id', variantId)
    .single()

  const oldStock = current?.stock_quantity ?? 0
  const diff = validStock - oldStock

  const { error } = await supabase
    .from('product_variants')
    .update({ stock_quantity: validStock })
    .eq('id', variantId)

  if (error) throw new Error(error.message)

  if (diff !== 0) {
    await supabase.from('inventory_movements').insert({
      variant_id: variantId,
      movement_type: diff > 0 ? 'restock' : 'adjustment',
      quantity_change: diff,
      note: note || `Ajuste manual de inventario (${oldStock} -> ${validStock})`,
      created_by: user.id
    })
  }

  revalidatePath('/')
  revalidatePath('/admin/products')
  return { success: true }
}

// -------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------

export async function setCategoryActive(id: string, active: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('categories').update({ is_active: active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function createCategory(name: string, description?: string) {
  const { supabase } = await requireAdmin()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('El nombre de la categoría es obligatorio.')

  const slug = slugify(trimmed)

  const { error } = await supabase.from('categories').insert({
    name: trimmed,
    slug,
    description: description?.trim() || null,
    is_active: true,
    sort_order: 50
  })

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/categories')
  return { success: true }
}

// -------------------------------------------------------------
// STORE SETTINGS
// -------------------------------------------------------------

export async function saveStoreSettings(formData: FormData) {
  const { supabase } = await requireAdmin()

  const payload = {
    id: 'default',
    whatsapp_number: String(formData.get('whatsapp_number') ?? '').trim(),
    whatsapp_message: String(formData.get('whatsapp_message') ?? '').trim(),
    bank_name: String(formData.get('bank_name') ?? '').trim(),
    bank_beneficiary: String(formData.get('bank_beneficiary') ?? '').trim(),
    bank_clabe: String(formData.get('bank_clabe') ?? '').trim(),
    bank_account: String(formData.get('bank_account') ?? '').trim(),
    bank_instructions: String(formData.get('bank_instructions') ?? '').trim(),
    shipping_flat_rate: Number(formData.get('shipping_flat_rate') ?? 150),
    free_shipping_threshold: Number(formData.get('free_shipping_threshold') ?? 999),
    shipping_estimated_days: String(formData.get('shipping_estimated_days') ?? '').trim(),
    instagram_url: String(formData.get('instagram_url') ?? '').trim(),
    facebook_url: String(formData.get('facebook_url') ?? '').trim(),
    tiktok_url: String(formData.get('tiktok_url') ?? '').trim(),
    announcement_text: String(formData.get('announcement_text') ?? '').trim(),
    hero_is_active: formData.get('hero_is_active') !== null ? (formData.get('hero_is_active') === 'true' || formData.get('hero_is_active') === 'on') : true,
    hero_media_type: String(formData.get('hero_media_type') ?? 'image'),
    hero_image_path: String(formData.get('hero_image_path') ?? ''),
    hero_video_path: String(formData.get('hero_video_path') ?? ''),
    hero_video_poster_path: String(formData.get('hero_video_poster_path') ?? ''),
    hero_eyebrow: String(formData.get('hero_eyebrow') ?? '').trim(),
    hero_title: String(formData.get('hero_title') ?? '').trim(),
    hero_subtitle: String(formData.get('hero_subtitle') ?? '').trim(),
    hero_button_text: String(formData.get('hero_button_text') ?? 'Descubrir colección').trim(),
    hero_button_url: String(formData.get('hero_button_url') ?? '#productos').trim(),
    ...(formData.has('shop_looks') ? {
      shop_looks: JSON.parse(String(formData.get('shop_looks')))
    } : {}),
    story_title: String(formData.get('story_title') ?? '').trim(),
    story_content: String(formData.get('story_content') ?? '').trim(),
    contact_email: String(formData.get('contact_email') ?? '').trim(),
    updated_at: new Date().toISOString()
  }

  // 1. Save to local fallback cache immediately
  try {
    const dataDir = path.join(process.cwd(), 'data')
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(
      path.join(dataDir, 'store-settings.json'),
      JSON.stringify(payload, null, 2),
      'utf-8'
    )
  } catch (fsErr) {
    console.warn('Local settings backup failed:', fsErr)
  }

  // 2. Save to Supabase remote database
  try {
    const { error } = await supabase.from('store_settings').upsert(payload)
    if (error) {
      console.warn('Supabase store_settings upsert notice:', error.message)
    }
  } catch (dbErr) {
    console.warn('Supabase store_settings error:', dbErr)
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/settings')
  revalidatePath('/admin/hero')
  revalidatePath('/admin/looks')
}
