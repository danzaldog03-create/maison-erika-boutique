import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Verify admin session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    // 2. Parse uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'avif']
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `Formato .${ext} no permitido. Usa JPG, PNG, WebP, GIF, MP4 o WebM.` }, { status: 400 })
    }

    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to local public/uploads directory
    const filePath = path.join(uploadsDir, filename)
    await fs.writeFile(filePath, buffer)

    // Also attempt background sync to Supabase Storage if bucket is available
    try {
      await supabase.storage
        .from('product-media')
        .upload(`uploads/${filename}`, buffer, { contentType: file.type, upsert: true })
    } catch {
      // Local copy is primary; remote sync failure is non-fatal
    }

    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename
    })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err?.message || 'Error al guardar archivo en el servidor' }, { status: 500 })
  }
}
