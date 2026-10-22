import { NextResponse } from 'next/server'
import { changerConsentement, estInscrit } from '@/lib/inscriptions'
import { sb } from '@/lib/supabase'
import { supabaseServeur } from '@/lib/supabase/serveur'

// Suppression du compte par le client lui-même (profil, adresses et favoris partent avec)
export async function POST() {
  const supabase = await supabaseServeur()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ error: 'non connecté' }, { status: 401 })

  const r = await sb(`auth/v1/admin/users/${data.user.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
  })
  if (!r.ok) {
    console.error('Suppression compte', r.status, await r.text())
    return NextResponse.json({ error: 'Le compte n’a pas pu être supprimé. Écris-nous à cercle@akarbi.fr.' }, { status: 502 })
  }
  const email = data.user.email?.toLowerCase()
  if (email && (await estInscrit(email))) await changerConsentement(email, false)
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
