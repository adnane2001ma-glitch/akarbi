import { NextResponse } from 'next/server'
import { changerConsentement, estInscrit, inscrire } from '@/lib/inscriptions'
import { supabaseServeur } from '@/lib/supabase/serveur'

async function emailConnecte() {
  const supabase = await supabaseServeur()
  const { data } = await supabase.auth.getUser()
  return data.user?.email?.toLowerCase() ?? null
}

export async function GET() {
  const email = await emailConnecte()
  if (!email) return NextResponse.json({ error: 'non connecté' }, { status: 401 })
  return NextResponse.json({ actif: await estInscrit(email) })
}

export async function POST(req: Request) {
  const email = await emailConnecte()
  if (!email) return NextResponse.json({ error: 'non connecté' }, { status: 401 })
  const { actif } = await req.json().catch(() => ({}))
  if (typeof actif !== 'boolean') return NextResponse.json({ error: 'invalide' }, { status: 400 })
  if (actif) await inscrire(email, { source: 'compte' })
  else if (await estInscrit(email)) await changerConsentement(email, false)
  return NextResponse.json({ ok: true, actif })
}
