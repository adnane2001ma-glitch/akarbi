import { NextResponse } from 'next/server'
import { ID_RE, nettoyerProduit } from '@/lib/catalogue'
import { sb } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

const filtre = (id: string) => `rest/v1/produits?id=eq.${encodeURIComponent(id)}`

async function enregistrer(id: string, donnees: Record<string, unknown>) {
  const r = await sb(filtre(id), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', prefer: 'return=representation' },
    body: JSON.stringify({ ...donnees, updated_at: new Date().toISOString() }),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  if (!((await r.json()) as unknown[]).length) return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params
  const res = nettoyerProduit({ ...(await req.json().catch(() => ({}))), id })
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 })
  return enregistrer(id, res.valeur)
}

// changements rapides depuis la liste : visibilité et ordre
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const maj: Record<string, unknown> = {}
  if (typeof body.publie === 'boolean') maj.publie = body.publie
  if (Number.isInteger(body.ordre)) maj.ordre = body.ordre
  if (Number.isInteger(body.ordre_femme)) maj.ordre_femme = body.ordre_femme
  if (!Object.keys(maj).length || !ID_RE.test(id)) return NextResponse.json({ error: 'invalide' }, { status: 400 })
  return enregistrer(id, maj)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const r = await sb(filtre(id), { method: 'DELETE', headers: { prefer: 'return=minimal' } })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
