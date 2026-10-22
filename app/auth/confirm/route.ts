import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { suiteSure, supabaseServeur } from '@/lib/supabase/serveur'

const TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'email_change', 'invite', 'magiclink']

// Liens des emails de confirmation et de mot de passe oublié
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  if (token_hash && type && TYPES.includes(type)) {
    const supabase = await supabaseServeur()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      const suite = type === 'recovery' ? '/compte/nouveau-mot-de-passe' : suiteSure(url.searchParams.get('suite'), '/compte?bienvenue=1')
      return NextResponse.redirect(new URL(suite, url.origin))
    }
  }
  return NextResponse.redirect(new URL('/compte/connexion?erreur=lien', url.origin))
}
