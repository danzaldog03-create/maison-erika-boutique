'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/settings'

export interface CreateOrderItemInput {
  variantId: string
  quantity: number
}

export interface CreateOrderInput {
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_reference?: string
  notes?: string
  items: CreateOrderItemInput[]
}

export interface OrderResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  error?: string
}

export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  try {
    const supabase = await createClient()
    const settings = await getStoreSettings()

    // 1. Validate customer details
    const name = input.customer_name?.trim()
    const email = input.customer_email?.trim().toLowerCase()
    const phone = input.customer_phone?.trim().replace(/[^0-9+]/g, '')
    const address = input.shipping_address?.trim()
    const city = input.shipping_city?.trim()
    const state = input.shipping_state?.trim()
    const postalCode = input.shipping_postal_code?.trim()
    const reference = input.shipping_reference?.trim() || null
    const notes = input.notes?.trim() || null

    if (!name || !email || !phone || !address || !city || !state || !postalCode) {
      return { success: false, error: 'Por favor completa todos los campos de contacto y envío.' }
    }

    if (!email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido.' }
    }

    if (phone.length < 10) {
      return { success: false, error: 'Por favor ingresa un número de teléfono de al menos 10 dígitos.' }
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      return { success: false, error: 'Tu bolsa de compras está vacía.' }
    }

    // 2. Fetch variants and verify stock & calculate prices securely on the server
    const variantIds = input.items.map((i) => i.variantId)
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        sku,
        stock_quantity,
        is_active,
        price_override,
        product_id,
        products (
          id,
          name,
          price,
          status
        )
      `)
      .in('id', variantIds)

    if (variantError || !variants || variants.length === 0) {
      return { success: false, error: 'No se pudieron verificar los productos en existencia.' }
    }

    const variantMap = new Map(variants.map((v: any) => [v.id, v]))

    let calculatedSubtotal = 0
    const processedItems: {
      productId: string
      variantId: string
      productName: string
      variantName: string
      sku: string | null
      unitPrice: number
      quantity: number
      itemSubtotal: number
      stockRemaining: number
    }[] = []

    for (const item of input.items) {
      const quantity = Math.floor(Number(item.quantity))
      if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        return { success: false, error: 'Cantidad de producto no válida.' }
      }

      const variant: any = variantMap.get(item.variantId)
      if (!variant) {
        return { success: false, error: `Una de las piezas seleccionadas ya no está disponible.` }
      }

      const product = variant.products
      if (!product || product.status !== 'active') {
        return { success: false, error: `La pieza "${product?.name || 'seleccionada'}" no está disponible actualmente.` }
      }

      if (variant.is_active === false) {
        return { success: false, error: `La opción "${variant.name}" de "${product.name}" está desactivada.` }
      }

      if (variant.stock_quantity < quantity) {
        return {
          success: false,
          error: `Existencias insuficientes para "${product.name}": sólo hay ${variant.stock_quantity} disponible(s).`
        }
      }

      const unitPrice = variant.price_override != null ? Number(variant.price_override) : Number(product.price)
      const itemSubtotal = unitPrice * quantity
      calculatedSubtotal += itemSubtotal

      processedItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku || product.sku || null,
        unitPrice,
        quantity,
        itemSubtotal,
        stockRemaining: variant.stock_quantity - quantity
      })
    }

    // 3. Calculate shipping & total
    const shippingCost = calculatedSubtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_flat_rate
    const calculatedTotal = calculatedSubtotal + shippingCost

    // Generate unique human-readable order number: ME-202611-XXXX
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    const orderNumber = `ME-${datePrefix}-${randomSuffix}`

    // Check optional authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // 4. Create Order in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_postal_code: postalCode,
        shipping_reference: reference,
        subtotal: calculatedSubtotal,
        shipping_cost: shippingCost,
        total: calculatedTotal,
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        status: 'pendiente',
        notes: notes,
        user_id: userId
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return { success: false, error: `No se pudo generar el pedido: ${orderError?.message || 'Error en base de datos.'}` }
    }

    // 5. Create Order Items
    const itemsToInsert = processedItems.map((pi) => ({
      order_id: order.id,
      product_id: pi.productId,
      variant_id: pi.variantId,
      product_name: pi.productName,
      variant_name: pi.variantName,
      sku: pi.sku,
      unit_price: pi.unitPrice,
      quantity: pi.quantity,
      subtotal: pi.itemSubtotal
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
    if (itemsError) {
      console.error('Order items error:', itemsError)
    }

    // 6. Decrement inventory and record movement
    for (const pi of processedItems) {
      await supabase
        .from('product_variants')
        .update({ stock_quantity: pi.stockRemaining })
        .eq('id', pi.variantId)

      await supabase.from('inventory_movements').insert({
        variant_id: pi.variantId,
        movement_type: 'sale',
        quantity_change: -pi.quantity,
        note: `Venta en pedido ${order.order_number}`,
        created_by: userId
      })
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/admin/orders')

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number
    }
  } catch (err: any) {
    console.error('Unexpected error creating order:', err)
    return { success: false, error: err?.message || 'Ocurrió un error inesperado al procesar tu pedido.' }
  }
}

export async function getOrderDetails(orderId: string) {
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_name,
        variant_name,
        sku,
        unit_price,
        quantity,
        subtotal,
        product_id
      )
    `)
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) return null
  return order
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado',
  trackingNumber?: string,
  carrier?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado.')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') throw new Error('Sólo administradores pueden modificar estados de pedidos.')

  const updatePayload: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber.trim() || null
  if (carrier !== undefined) updatePayload.carrier = carrier.trim() || null
  if (newStatus === 'confirmado') updatePayload.payment_status = 'paid'

  const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders')
  revalidatePath(`/pedidos/${orderId}`)
  return { success: true }
}
