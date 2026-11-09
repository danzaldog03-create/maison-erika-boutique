"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") throw new Error("No tienes permisos de administración.")
  return { supabase, user }
}

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim()
}

export async function createProduct(form: FormData) {
  const { supabase, user } = await adminClient()
  const name = text(form, "name")
  const category_id = text(form, "category_id")
  const price = Number(text(form, "price"))
  const stock = Number(text(form, "stock") || "0")
  const sku = text(form, "sku") || null
  const short_description = text(form, "short_description") || null
  const description = text(form, "description") || null
  const material = text(form, "material") || null
  const status = text(form, "status") === "active" ? "active" : "draft"
  if (!name || !category_id || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    throw new Error("Revisa nombre, categoría, precio y existencias.")
  }
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + crypto.randomUUID().slice(0, 8)
  const { data: product, error } = await supabase.from("products").insert({
    category_id, name, slug, sku, short_description, description, material,
    status, price, track_inventory: true, published_at: status === "active" ? new Date().toISOString() : null
  }).select("id").single()
  if (error) throw new Error(error.message)

  const { data: variant, error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id, name: "Única", sku, stock_quantity: stock, is_active: true
  }).select("id").single()
  if (variantError) {
    await supabase.from("products").delete().eq("id", product.id)
    throw new Error(`Producto creado, pero falló la variante: ${variantError.message}`)
  }
  if (stock > 0) {
    const { error: movementError } = await supabase.from("inventory_movements").insert({
      variant_id: variant.id, movement_type: "initial", quantity_change: stock,
      note: "Existencia inicial al crear el producto", created_by: user.id
    })
    if (movementError) throw new Error(`Producto creado; no se pudo registrar el movimiento inicial: ${movementError.message}`)
  }
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/products")
  redirect("/admin/products?created=1")
}

export async function updateProductStatus(id: string, status: "draft" | "active" | "archived") {
  const { supabase } = await adminClient()
  const { error } = await supabase.from("products").update({
    status, published_at: status === "active" ? new Date().toISOString() : null
  }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/")
  revalidatePath("/admin/products")
}

export async function updateCategoryActive(id: string, is_active: boolean) {
  const { supabase } = await adminClient()
  const { error } = await supabase.from("categories").update({ is_active }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/")
  revalidatePath("/admin/categories")
}
