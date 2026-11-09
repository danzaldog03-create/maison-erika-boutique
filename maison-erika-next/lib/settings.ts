import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'
import { StoreSettings, DEFAULT_SETTINGS, DEFAULT_LOOKS } from '@/lib/settings-types'

export * from '@/lib/settings-types'

export async function getStoreSettings(): Promise<StoreSettings> {
  let localData: any = null
  try {
    const localFile = path.join(process.cwd(), 'data', 'store-settings.json')
    const content = await fs.readFile(localFile, 'utf-8')
    localData = JSON.parse(content)
  } catch {
    // Local cache doesn't exist yet
  }

  let dbData: any = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    dbData = data
  } catch {
    // Supabase query fallback
  }

  // Active dataset: merge DB with local fallback
  const rawData = {
    ...DEFAULT_SETTINGS,
    ...(localData || {}),
    ...(dbData || {})
  }

  // Parse shop_looks safely from DB or localData
  let looksSource = dbData?.shop_looks ?? localData?.shop_looks ?? DEFAULT_LOOKS
  if (typeof looksSource === 'string') {
    try {
      looksSource = JSON.parse(looksSource)
    } catch {
      looksSource = null
    }
  }
  if (typeof looksSource === 'string') {
    try {
      looksSource = JSON.parse(looksSource)
    } catch {
      // ignore
    }
  }

  const validLooks = (Array.isArray(looksSource) && looksSource.length > 0)
    ? looksSource
    : DEFAULT_LOOKS

  return {
    whatsapp_number: rawData.whatsapp_number ?? DEFAULT_SETTINGS.whatsapp_number,
    whatsapp_message: rawData.whatsapp_message ?? DEFAULT_SETTINGS.whatsapp_message,
    bank_name: rawData.bank_name ?? DEFAULT_SETTINGS.bank_name,
    bank_beneficiary: rawData.bank_beneficiary ?? DEFAULT_SETTINGS.bank_beneficiary,
    bank_clabe: rawData.bank_clabe ?? DEFAULT_SETTINGS.bank_clabe,
    bank_account: rawData.bank_account ?? DEFAULT_SETTINGS.bank_account,
    bank_instructions: rawData.bank_instructions ?? DEFAULT_SETTINGS.bank_instructions,
    shipping_flat_rate: Number(rawData.shipping_flat_rate ?? DEFAULT_SETTINGS.shipping_flat_rate),
    free_shipping_threshold: Number(rawData.free_shipping_threshold ?? DEFAULT_SETTINGS.free_shipping_threshold),
    shipping_estimated_days: rawData.shipping_estimated_days ?? DEFAULT_SETTINGS.shipping_estimated_days,
    instagram_url: rawData.instagram_url ?? DEFAULT_SETTINGS.instagram_url,
    facebook_url: rawData.facebook_url ?? DEFAULT_SETTINGS.facebook_url,
    tiktok_url: rawData.tiktok_url ?? DEFAULT_SETTINGS.tiktok_url,
    announcement_text: rawData.announcement_text ?? DEFAULT_SETTINGS.announcement_text,
    hero_is_active: rawData.hero_is_active !== undefined ? Boolean(rawData.hero_is_active) : DEFAULT_SETTINGS.hero_is_active,
    hero_media_type: (rawData.hero_media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
    hero_image_path: rawData.hero_image_path || DEFAULT_SETTINGS.hero_image_path,
    hero_video_path: rawData.hero_video_path || DEFAULT_SETTINGS.hero_video_path,
    hero_video_poster_path: rawData.hero_video_poster_path || DEFAULT_SETTINGS.hero_video_poster_path,
    hero_eyebrow: rawData.hero_eyebrow ?? DEFAULT_SETTINGS.hero_eyebrow,
    hero_title: rawData.hero_title ?? DEFAULT_SETTINGS.hero_title,
    hero_subtitle: rawData.hero_subtitle ?? DEFAULT_SETTINGS.hero_subtitle,
    hero_button_text: rawData.hero_button_text ?? DEFAULT_SETTINGS.hero_button_text,
    hero_button_url: rawData.hero_button_url ?? DEFAULT_SETTINGS.hero_button_url,
    shop_looks: validLooks,
    story_title: rawData.story_title ?? DEFAULT_SETTINGS.story_title,
    story_content: rawData.story_content ?? DEFAULT_SETTINGS.story_content,
    contact_email: rawData.contact_email ?? DEFAULT_SETTINGS.contact_email
  }
}
