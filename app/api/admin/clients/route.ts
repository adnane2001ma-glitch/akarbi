import { NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'

type UtilisateurAuth = { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null; app_metadata?: { providers?: string[] } }

export async function GET() {
  const auth = { authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
  const utilisateurs: UtilisateurAuth[] = []
  for (let page = 1; page <= 20; page++) {
    const r = await sb(`auth/v1/admin/users?page=${page}&per_page=500`, { headers: auth })
    if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
    const lot = ((await r.json()) as { users: UtilisateurAuth[] }).users
    utilisateurs.push(...lot)
    if (lot.length < 500) break
  }
  const [p, i] = await Promise.all([
    sb('rest/v1/profils?select=*'),
    sb('rest/v1/inscriptions?select=email&consentement=eq.true'),
  ])
  if (!p.ok || !i.ok) return NextResponse.json({ error: 'Supabase indisponible' }, { status: 502 })
  const profils = new Map(((await p.json()) as { id: string }[]).map((x) => [x.id, x]))
  const abonnes = new Set(((await i.json()) as { email: string }[]).map((x) => x.email))

  const clients = utilisateurs
    .map((u) => ({
      ...(profils.get(u.id) ?? {}),
      id: u.id,
      email: u.email ?? '',
      confirme: !!u.email_confirmed_at,
      connexion: (u.app_metadata?.providers ?? []).join(', '),
      inscrit_le: u.created_at,
      derniere_visite: u.last_sign_in_at ?? null,
      newsletter: abonnes.has((u.email ?? '').toLowerCase()),
    }))
    .sort((a, b) => b.inscrit_le.localeCompare(a.inscrit_le))
  return NextResponse.json(clients)
}
