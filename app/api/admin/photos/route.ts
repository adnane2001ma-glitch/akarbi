import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sb, urlPhotosPubliques } from '@/lib/supabase'

const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const fichier = form?.get('photo')
  if (!(fichier instanceof File)) return NextResponse.json({ error: 'Aucune photo reçue.' }, { status: 400 })
  const ext = TYPES[fichier.type]
  if (!ext) return NextResponse.json({ error: 'Format non pris en charge (JPEG, PNG ou WebP).' }, { status: 400 })
  if (fichier.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Photo trop lourde (4 Mo maximum).' }, { status: 400 })

  const chemin = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`
  const r = await sb(`storage/v1/object/catalogue/${chemin}`, {
    method: 'POST',
    headers: { 'content-type': fichier.type, 'cache-control': 'max-age=31536000' },
    body: Buffer.from(await fichier.arrayBuffer()),
  })
  if (!r.ok) return NextResponse.json({ error: `Envoi impossible : ${await r.text()}` }, { status: 502 })
  return NextResponse.json({ url: urlPhotosPubliques() + chemin })
}
