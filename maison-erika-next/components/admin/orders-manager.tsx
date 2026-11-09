'use client'

import React, { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { updateOrderStatus } from '@/lib/orders/actions'

export interface OrderItem {
  id: string
  product_name: string
  variant_name: string
  sku: string | null
  unit_price: number
  quantity: number
  subtotal: number
}

export interface OrderRecord {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_reference: string | null
  notes: string | null
  subtotal: number
  shipping_cost: number
  total: number
  payment_method: string
  payment_status: string
  status: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado'
  tracking_number: string | null
  carrier: string | null
  created_at: string
  order_items?: OrderItem[]
}

export function OrdersManager({
  orders: initialOrders,
  commercialWhatsapp
}: {
  orders: OrderRecord[]
  commercialWhatsapp: string
}) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [message, setMessage] = useState('')
  const [busy, startTransition] = useTransition()

  // Tracking modal state
  const [shippingModalOrder, setShippingModalOrder] = useState<OrderRecord | null>(null)
  const [carrierInput, setCarrierInput] = useState('DHL')
  const [trackingInput, setTrackingInput] = useState('')

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'todos' || o.status === statusFilter
      const q = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      return matchesStatus && matchesQuery
    })
  }, [orders, statusFilter, searchQuery])

  const handleStatusChange = async (
    order: OrderRecord,
    newStatus: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado'
  ) => {
    if (newStatus === 'enviado') {
      setShippingModalOrder(order)
      setCarrierInput(order.carrier || 'DHL')
      setTrackingInput(order.tracking_number || '')
      return
    }

    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, newStatus)
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
        )
        setMessage(`Pedido #${order.order_number} actualizado a "${newStatus}".`)
      } catch (err: any) {
        setMessage(`Error: ${err?.message || 'No se pudo actualizar el estado.'}`)
      }
    })
  }

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingModalOrder) return

    startTransition(async () => {
      try {
        await updateOrderStatus(shippingModalOrder.id, 'enviado', trackingInput, carrierInput)
        setOrders((prev) =>
          prev.map((o) =>
            o.id === shippingModalOrder.id
              ? { ...o, status: 'enviado', carrier: carrierInput, tracking_number: trackingInput }
              : o
          )
        )
        setMessage(`Pedido #${shippingModalOrder.order_number} marcado como enviado con guía ${trackingInput}.`)
        setShippingModalOrder(null)
      } catch (err: any) {
        setMessage(`Error: ${err?.message || 'No se pudo actualizar el envío.'}`)
      }
    })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <span className="status status-active">Confirmado</span>
      case 'enviado':
        return <span className="status status-active">Enviado</span>
      case 'entregado':
        return <span className="status status-active">Entregado</span>
      case 'cancelado':
        return <span className="status status-archived">Cancelado</span>
      default:
        return <span className="status status-draft">Pendiente de pago</span>
    }
  }

  const customerWhatsappUrl = (order: OrderRecord) => {
    const text = `¡Hola ${order.customer_name}! Te saludamos de Maison Erika respecto a tu pedido #${order.order_number}.`
    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '')
    const fullPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="orders-admin-wrap">
      {message && <div className="admin-alert admin-alert-success">{message}</div>}

      {/* Toolbar */}
      <div className="orders-toolbar">
        <div className="admin-status-tabs">
          {['todos', 'pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'].map((st) => (
            <button
              key={st}
              type="button"
              className={statusFilter === st ? 'active' : ''}
              onClick={() => setStatusFilter(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)} (
              {st === 'todos' ? orders.length : orders.filter((o) => o.status === st).length})
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar por # pedido, cliente, correo o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="orders-search-input"
        />
      </div>

      {/* Orders Table */}
      <div className="catalog-table-wrap">
        <table className="catalog-table">
          <thead>
            <tr>
              <th># Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Cambiar estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.order_number}</strong>
                  <small>{order.payment_method === 'bank_transfer' ? 'Transferencia SPEI' : order.payment_method}</small>
                </td>
                <td>
                  <span>{new Date(order.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <small>{new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td>
                  <strong>{order.customer_name}</strong>
                  <small>{order.customer_phone} · {order.customer_email}</small>
                  <small>{order.shipping_city}, {order.shipping_state}</small>
                </td>
                <td>
                  <strong>${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                  <small>{order.order_items?.length || 0} artículos</small>
                </td>
                <td>{statusBadge(order.status)}</td>
                <td>
                  <select
                    value={order.status}
                    disabled={busy}
                    onChange={(e) => handleStatusChange(order, e.target.value as any)}
                    className="order-status-select"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="enviado">Enviado (Guía)</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td>
                  <div className="table-actions-group">
                    <button
                      type="button"
                      className="table-action-icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      👁 Detalle
                    </button>
                    <a
                      href={customerWhatsappUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-action-icon"
                      title="Enviar mensaje por WhatsApp"
                    >
                      💬 WhatsApp
                    </a>
                    <Link
                      href={`/pedidos/${order.id}`}
                      target="_blank"
                      className="table-action-icon"
                      title="Ver vista de cliente"
                    >
                      ↗ Recibo
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '35px' }}>
                  No se encontraron pedidos con este estado o búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ORDER DETAILS */}
      {/* ------------------------------------------------------------- */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Detalle del Pedido: {selectedOrder.order_number}</h2>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="order-modal-body">
              <div className="form-row-two">
                <div>
                  <h3>Datos del cliente</h3>
                  <p><strong>Nombre:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Teléfono:</strong> {selectedOrder.customer_phone}</p>
                  <p><strong>Correo:</strong> {selectedOrder.customer_email}</p>
                </div>
                <div>
                  <h3>Dirección de entrega</h3>
                  <p>{selectedOrder.shipping_address}</p>
                  <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state}, C.P. {selectedOrder.shipping_postal_code}</p>
                  {selectedOrder.shipping_reference && <p><strong>Referencias:</strong> {selectedOrder.shipping_reference}</p>}
                  {selectedOrder.notes && <p><strong>Notas especiales:</strong> {selectedOrder.notes}</p>}
                </div>
              </div>

              {(selectedOrder.tracking_number || selectedOrder.carrier) && (
                <div className="order-shipping-data-box">
                  <h3>Datos de paquetería</h3>
                  <p>Paquetería: <strong>{selectedOrder.carrier}</strong> | Guía: <code>{selectedOrder.tracking_number}</code></p>
                </div>
              )}

              <h3>Artículos comprados ({selectedOrder.order_items?.length || 0})</h3>
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th>Pieza</th>
                    <th>Variante</th>
                    <th>SKU</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.order_items || []).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.product_name}</strong></td>
                      <td>{item.variant_name}</td>
                      <td>{item.sku || '—'}</td>
                      <td>${Number(item.unit_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td>{item.quantity}</td>
                      <td>${Number(item.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="summary-calc-box" style={{ maxWidth: '320px', marginLeft: 'auto', marginTop: '18px' }}>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>${Number(selectedOrder.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
                <div className="summary-row">
                  <span>Envío</span>
                  <strong>${Number(selectedOrder.shipping_cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
                <div className="summary-divider" />
                <div className="summary-row summary-grand-total">
                  <span>Total</span>
                  <strong>${Number(selectedOrder.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <a
                href={customerWhatsappUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="pill"
              >
                Contactar cliente por WhatsApp ↗
              </a>
              <button
                type="button"
                className="primary"
                onClick={() => setSelectedOrder(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SHIPPING GUIDE */}
      {/* ------------------------------------------------------------- */}
      {shippingModalOrder && (
        <div className="admin-modal-backdrop" onClick={() => setShippingModalOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Registrar guía de envío: #{shippingModalOrder.order_number}</h2>
              <button className="admin-modal-close" onClick={() => setShippingModalOrder(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveShipping} className="product-form">
              <label>
                Empresa de paquetería *
                <select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  required
                >
                  <option value="DHL">DHL Express</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Estafeta">Estafeta</option>
                  <option value="Redpack">Redpack</option>
                  <option value="Paquetexpress">Paquetexpress</option>
                  <option value="Correos de México">Correos de México</option>
                  <option value="Entrega Personal">Entrega Personal (Aguascalientes)</option>
                </select>
              </label>

              <label>
                Número de guía / rastreo *
                <input
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  required
                  placeholder="Ej. 1234567890"
                />
              </label>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShippingModalOrder(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={busy}>
                  {busy ? 'GUARDANDO...' : 'GUARDAR Y MARCAR ENVIADO ↗'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
