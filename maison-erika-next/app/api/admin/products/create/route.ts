import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") return NextResponse.json({ error: "No tienes permisos." }, { status: 403 })

  const form = await request.formData()
  const name = String(form.get("name") ?? "").trim()
  const category_id = String(form.get("category_id") ?? "")
  const price = Number(form.get("price"))
  const stock = Number(form.get("stock") || 0)
  const sku = String(form.get("sku") ?? "").trim() || null
  const short_description = String(form.get("short_description") ?? "").trim() || null
  const description = String(form.get("description") ?? "").trim() || null
  const material = String(form.get("material") ?? "").trim() || null
  const status = form.get("status") === "active" ? "active" : "draft"
  if (!name || !category_id || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Revisa nombre, categoría, precio y existencias." }, { status: 400 })

  const slugBase = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const slug = `${slugBase}-${crypto.randomUUID().slice(0,8)}`
  const { data: product, error } = await supabase.from("products").insert({
    category_id, name, slug, sku, short_description, description, material, status, price,
    track_inventory: true, published_at: status === "active" ? new Date().toISOString() : null
  }).select("id").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: variant, error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id, name: "Única", sku, stock_quantity: stock, is_active: true
  }).select("id").single()
  if (variantError) {
    await supabase.from("products").delete().eq("id", product.id)
    return NextResponse.json({ error: variantError.message }, { status: 400 })
  }
  if (stock > 0) {
    const { error: movementError } = await supabase.from("inventory_movements").insert({
      variant_id: variant.id, movement_type: "initial", quantity_change: stock,
      note: "Existencia inicial al crear el producto", created_by: user.id
    })
    if (movementError) return NextResponse.json({ error: `Producto creado; no se registró el movimiento inicial: ${movementError.message}`, id: product.id }, { status: 500 })
  }
  return NextResponse.json({ id: product.id })
}
