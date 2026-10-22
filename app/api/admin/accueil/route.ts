import { NextResponse } from 'next/server'
import { ACCUEIL_DEFAUT, ecrireAccueil, lireAccueil, nettoyerAccueil } from '@/lib/accueil'

export async function GET() {
  const { accueil, source } = await lireAccueil()
  return NextResponse.json({ accueil, source, origine: ACCUEIL_DEFAUT })
}

export async function PUT(req: Request) {
  const corps = await req.json().catch(() => null)
  if (!corps || typeof corps !== 'object') return NextResponse.json({ error: 'Réglages illisibles.' }, { status: 400 })
  const accueil = nettoyerAccueil(corps)
  try {
    await ecrireAccueil(accueil)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
  return NextResponse.json({ ok: true, accueil })
}
