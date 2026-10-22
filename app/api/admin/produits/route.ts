import { NextResponse } from 'next/server'
import { nettoyerProduit } from '@/lib/catalogue'
import { sb } from '@/lib/supabase'

export async function GET() {
  const r = await sb('rest/v1/produits?select=*&order=ordre,id')
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json(await r.json())
}

export async function POST(req: Request) {
  const res = nettoyerProduit(await req.json().catch(() => ({})))
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 })
  const r = await sb('rest/v1/produits', {
    method: 'POST',
    headers: { 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify(res.valeur),
  })
  if (r.status === 409) return NextResponse.json({ error: 'Un produit utilise déjà cette adresse de page. Choisis-en une autre.' }, { status: 409 })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true, id: res.valeur.id })
}
