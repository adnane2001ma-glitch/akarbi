import { NextResponse } from 'next/server'
import { lireAccueil } from '@/lib/accueil'

// Lu par l'accueil du site (public/akarbi/index.html) à chaque visite.
export async function GET() {
  const { accueil } = await lireAccueil()
  return NextResponse.json(accueil, { headers: { 'cache-control': 'public, s-maxage=15, stale-while-revalidate=60' } })
}
