import { NextResponse } from 'next/server'
import { ID_RE } from '@/lib/catalogue'
import { nettoyerSelection } from '@/lib/heritage'
import { sb } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

const filtre = (id: string) => `rest/v1/heritage?id=eq.${encodeURIComponent(id)}`

async function enregistrer(id: string, donnees: Record<string, unknown>) {
  const r = await sb(filtre(id), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', prefer: 'return=representation' },
    body: JSON.stringify({ ...donnees, updated_at: new Date().toISOString() }),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  if (!((await r.json()) as unknown[]).length) return NextResponse.json({ error: 'Sélection introuvable.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params
  const res = nettoyerSelection({ ...(await req.json().catch(() => ({}))), id })
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 })
  return enregistrer(id, res.valeur)
}

// changements rapides depuis la liste : visibilité, mise en avant et ordre
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const maj: Record<string, unknown> = {}
  if (typeof body.publie === 'boolean') maj.publie = body.publie
  if (typeof body.a_la_une === 'boolean') maj.a_la_une = body.a_la_une
  if (Number.isInteger(body.ordre)) maj.ordre = body.ordre
  if (!Object.keys(maj).length || !ID_RE.test(id)) return NextResponse.json({ error: 'invalide' }, { status: 400 })
  return enregistrer(id, maj)
}

// Les produits qui citaient cette sélection gardent l'id : le site ignore les sélections absentes.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const r = await sb(filtre(id), { method: 'DELETE', headers: { prefer: 'return=minimal' } })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
