import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/lib/cart/cart-context'
import { CartDrawer } from '@/components/cart/cart-drawer'

export const metadata: Metadata = {
  title: 'Maison Erika | Pequeños tesoros, grandes detalles',
  description: 'Joyería y accesorios con un toque especial. Maison Erika by Erika Martínez.',
  icons: { icon: '/maison-erika-logo.jpeg', apple: '/maison-erika-logo.jpeg' }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
