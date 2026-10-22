import { NextResponse } from 'next/server'
import { supabaseServeur } from '@/lib/supabase/serveur'

// Lu par le site (public/akarbi/index.html) : menu compte, favoris, bouton Commander
export async function GET() {
  const supabase = await supabaseServeur()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ connecte: false }, { headers: { 'cache-control': 'no-store' } })
  const [p, f] = await Promise.all([
    supabase.from('profils').select('prenom').eq('id', data.user.id).maybeSingle(),
    supabase.from('favoris').select('produit_id'),
  ])
  return NextResponse.json(
    { connecte: true, prenom: p.data?.prenom ?? '', favoris: (f.data ?? []).map((x) => x.produit_id) },
    { headers: { 'cache-control': 'no-store' } },
  )
}
