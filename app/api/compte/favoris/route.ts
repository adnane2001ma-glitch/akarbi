import { NextResponse } from 'next/server'
import { ID_RE } from '@/lib/catalogue'
import { supabaseServeur } from '@/lib/supabase/serveur'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const produit = typeof body.produit === 'string' ? body.produit : ''
  if (!ID_RE.test(produit) || typeof body.actif !== 'boolean') return NextResponse.json({ error: 'invalide' }, { status: 400 })

  const supabase = await supabaseServeur()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ error: 'non connecté' }, { status: 401 })

  const { error } = body.actif
    ? await supabase.from('favoris').upsert({ user_id: data.user.id, produit_id: produit }, { ignoreDuplicates: true })
    : await supabase.from('favoris').delete().eq('produit_id', produit)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
