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
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let publicUrl = ''

    // 1. Primary storage: Supabase Storage bucket 'product-media' (Persistent on Vercel)
    try {
      const storagePath = `uploads/${filename}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        })

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('product-media')
          .getPublicUrl(storagePath)
        publicUrl = urlData.publicUrl
      } else if (uploadError) {
        console.warn('Supabase storage upload notice:', uploadError.message)
      }
    } catch (storageErr) {
      console.warn('Supabase storage exception:', storageErr)
    }

    // 2. Secondary local cache (only in development environments with writable disk)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })
      const filePath = path.join(uploadsDir, filename)
      await fs.writeFile(filePath, buffer)
      if (!publicUrl) {
        publicUrl = `/uploads/${filename}`
      }
    } catch {
      // Ignored: On serverless platforms (Vercel/AWS Lambda), filesystem is read-only (EROFS).
    }

    if (!publicUrl) {
      return NextResponse.json(
        { error: 'No se pudo almacenar el archivo. Verifica los permisos del bucket product-media en Supabase.' },
        { status: 500 }
      )
    }

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
