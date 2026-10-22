import { NextResponse } from 'next/server'
import { assurerBucket, BUCKET, SECTIONS, urlPublique } from '@/lib/accueil'
import { sb } from '@/lib/supabase'

const TYPES: Record<string, string> = { 'video/webm': 'webm', 'video/mp4': 'mp4', 'image/webp': 'webp' }

// Les vidéos dépassent la limite d'envoi des routes (4,5 Mo) : le navigateur les envoie directement
// au stockage, avec une adresse signée valable quelques minutes, fournie ici.
export async function POST(req: Request) {
  const { section, type } = (await req.json().catch(() => ({}))) as { section?: string; type?: string }
  if (!SECTIONS.includes(section as never)) return NextResponse.json({ error: 'Partie inconnue.' }, { status: 400 })
  const ext = TYPES[type || '']
  if (!ext) return NextResponse.json({ error: 'Format non pris en charge (WebM ou MP4).' }, { status: 400 })
  try {
    await assurerBucket()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
  const chemin = `${section}-${Date.now()}.${ext}`
  const r = await sb(`storage/v1/object/upload/sign/${BUCKET}/${chemin}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => null)
  if (!r) return NextResponse.json({ error: 'Le stockage ne répond pas. Réessaie dans un instant.' }, { status: 502 })
  if (!r.ok) return NextResponse.json({ error: `Envoi impossible : ${await r.text()}` }, { status: 502 })
  const { url } = (await r.json()) as { url: string }
  return NextResponse.json({ envoi: `${process.env.SUPABASE_URL}/storage/v1${url}`, url: urlPublique(chemin) })
}
