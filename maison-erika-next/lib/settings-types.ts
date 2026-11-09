export interface LookItem {
  id: string
  title: string
  subtitle: string
  badge: string
  priceHint?: string
  mediaType: 'image' | 'video'
  mediaUrl: string
  videoUrl?: string
  ctaText: string
  ctaUrl: string
}

export interface StoreSettings {
  whatsapp_number: string
  whatsapp_message: string
  bank_name: string
  bank_beneficiary: string
  bank_clabe: string
  bank_account: string
  bank_instructions: string
  shipping_flat_rate: number
  free_shipping_threshold: number
  shipping_estimated_days: string
  instagram_url: string
  facebook_url: string
  tiktok_url: string
  announcement_text: string
  hero_is_active: boolean
  hero_media_type: 'image' | 'video'
  hero_image_path: string
  hero_video_path: string
  hero_video_poster_path: string
  hero_eyebrow: string
  hero_title: string
  hero_subtitle: string
  hero_button_text: string
  hero_button_url: string
  shop_looks: LookItem[]
  story_title: string
  story_content: string
  contact_email: string
}

export const DEFAULT_LOOKS: LookItem[] = [
  {
    id: 'look-1',
    title: 'Aretes Duna & Aros Oro',
    subtitle: 'El toque sutil de luminosidad que eleva cualquier outfit casual o formal.',
    badge: '✦ BEST SELLER',
    priceHint: 'Desde $390 MXN',
    mediaType: 'image',
    mediaUrl: '/looks/look-1-aretes.jpg',
    ctaText: 'Comprar aretes ↗',
    ctaUrl: '#productos'
  },
  {
    id: 'look-2',
    title: 'Gargantilla Perla Barroca',
    subtitle: 'Elegancia orgánica contemporánea con cadena fina y medalla conmemorativa.',
    badge: '✧ PERLAS & ORO',
    priceHint: 'Desde $520 MXN',
    mediaType: 'image',
    mediaUrl: '/looks/look-2-collar.jpg',
    ctaText: 'Comprar collar ↗',
    ctaUrl: '#productos'
  },
  {
    id: 'look-3',
    title: 'Set Anillos Apilados',
    subtitle: 'Texturas en relieve y solitario de circonia con destellos en oro rosa.',
    badge: '✦ TENDENCIA 2026',
    priceHint: 'Desde $440 MXN',
    mediaType: 'image',
    mediaUrl: '/looks/look-3-anillos.jpg',
    ctaText: 'Comprar anillos ↗',
    ctaUrl: '#productos'
  },
  {
    id: 'look-4',
    title: 'Unboxing & Regalo Boutique',
    subtitle: 'Cada joya se entrega en nuestra caja rígida con lazo de satén y tarjeta personalizada.',
    badge: '🎁 EMPAQUE DE REGALO',
    priceHint: 'Incluido en tu pedido',
    mediaType: 'image',
    mediaUrl: '/looks/look-4-unboxing.jpg',
    ctaText: 'Elegir para regalo ↗',
    ctaUrl: '#productos'
  }
]

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsapp_number: '524490000000',
  whatsapp_message: '¡Hola! Me gustaría información sobre un pedido en Maison Erika.',
  bank_name: 'BBVA México',
  bank_beneficiary: 'Maison Erika / Erika Martínez',
  bank_clabe: '012180000000000000',
  bank_account: '1234567890',
  bank_instructions: 'Realiza tu transferencia usando tu número de pedido como concepto o referencia. Envíanos tu comprobante por WhatsApp para validar tu compra.',
  shipping_flat_rate: 150,
  free_shipping_threshold: 999,
  shipping_estimated_days: '3 a 5 días hábiles',
  instagram_url: 'https://www.instagram.com/erika_maison_ags/',
  facebook_url: '',
  tiktok_url: '',
  announcement_text: 'UN DETALLE BONITO PUEDE CAMBIAR TODO · ENVÍOS A TODO MÉXICO',
  hero_is_active: true,
  hero_media_type: 'image',
  hero_image_path: '/hero/editorial-jewelry-hero.jpg',
  hero_video_path: '',
  hero_video_poster_path: '/hero/editorial-jewelry-hero.jpg',
  hero_eyebrow: 'A LITTLE WORLD OF BEAUTY',
  hero_title: 'Pequeños tesoros, grandes detalles.',
  hero_subtitle: 'Accesorios seleccionados para acompañarte y hacer especial cada momento.',
  hero_button_text: 'Descubrir colección',
  hero_button_url: '#productos',
  shop_looks: DEFAULT_LOOKS,
  story_title: 'La belleza está en los detalles.',
  story_content: 'Maison Erika nace en Aguascalientes, México, con la ilusión de convertir los pequeños detalles en momentos especiales. Creemos que los accesorios son mucho más que un complemento: son una expresión de personalidad, elegancia y estilo propio. Seleccionamos piezas pensadas para acompañarte en cada ocasión, desde los días cotidianos hasta esos momentos que merecen brillar.',
  contact_email: 'hola@maisonerika.mx'
}
