import { NextResponse } from 'next/server'
import { nettoyerPageHeritage, PAGE_HERITAGE_DEFAUT, type PageHeritage } from '@/lib/heritage'
import { sb } from '@/lib/supabase'

export async function GET() {
  const r = await sb('rest/v1/heritage_page?select=image,image_alt,surtitre,titre,texte&id=eq.1')
  if (!r.ok) return NextResponse.json({ error: 'L’en-tête de la page est indisponible. Le script supabase/heritage-2.sql a-t-il été lancé ?' }, { status: 502 })
  return NextResponse.json(((await r.json()) as PageHeritage[])[0] ?? PAGE_HERITAGE_DEFAUT)
}

export async function PUT(req: Request) {
  const res = nettoyerPageHeritage(await req.json().catch(() => ({})))
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 })
  const r = await sb('rest/v1/heritage_page?on_conflict=id', {
    method: 'POST',
    headers: { 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 1, ...res.valeur, updated_at: new Date().toISOString() }),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
