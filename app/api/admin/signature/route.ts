import { NextResponse } from 'next/server'
import { nettoyerSignature } from '@/lib/catalogue'
import { sb } from '@/lib/supabase'

export async function GET() {
  const r = await sb('rest/v1/signature?select=*&order=position')
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json(await r.json())
}

export async function PUT(req: Request) {
  const res = nettoyerSignature(await req.json().catch(() => null))
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 })
  const r = await sb('rest/v1/signature?on_conflict=position', {
    method: 'POST',
    headers: { 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(res.valeur),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
