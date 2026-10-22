import { NextResponse } from 'next/server'
import { suiteSure, supabaseServeur } from '@/lib/supabase/serveur'

// Retour de Google (et des liens email au format « code »)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const suite = suiteSure(url.searchParams.get('suite'))
  if (code) {
    const supabase = await supabaseServeur()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(suite, url.origin))
  }
  return NextResponse.redirect(new URL('/compte/connexion?erreur=lien', url.origin))
}
