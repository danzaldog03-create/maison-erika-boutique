'use client'
import { createClient } from '@/lib/supabase/client'

export function GoogleLoginButton({ compact = false }: { compact?: boolean }) {
  const signIn = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` }
    })
    if (error) alert(`No fue posible iniciar sesión: ${error.message}`)
  }
  return <button className={compact ? 'pill' : 'primary'} onClick={signIn}>CONTINUAR CON GOOGLE</button>
}
