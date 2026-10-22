import { NextResponse } from 'next/server'
import { nettoyerSelection } from '@/lib/heritage'
import { sb } from '@/lib/supabase'

export async function GET() {
  const r = await sb('rest/v1/heritage?select=*&order=ordre,id')
  if (!r.ok) return NextResponse.json({ error: 'Les sélections HÉRITAGE sont indisponibles. Le script supabase/heritage.sql a-t-il été lancé ?' }, { status: 502 })
  return NextResponse.json(await r.json())
}

export async function POST(req: Request) {
  const res = nettoyerSelection(await req.json().catch(() => ({})))
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 })
  const r = await sb('rest/v1/heritage', {
    method: 'POST',
    headers: { 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify(res.valeur),
  })
  if (r.status === 409) return NextResponse.json({ error: 'Une sélection utilise déjà cette adresse de page. Choisis-en une autre.' }, { status: 409 })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true, id: res.valeur.id })
}
