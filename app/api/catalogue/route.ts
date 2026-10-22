import { NextResponse } from 'next/server'
import { versSite, type Produit, type Signature } from '@/lib/catalogue'
import { FAMILLES, PAGE_HERITAGE_DEFAUT, selectionVersSite, trierSelections, type PageHeritage, type Selection } from '@/lib/heritage'
import { sb } from '@/lib/supabase'

export async function GET() {
  const [p, s, h, hp] = await Promise.all([
    sb('rest/v1/produits?select=*&publie=eq.true&order=ordre,id'),
    sb('rest/v1/signature?select=*&order=position'),
    sb('rest/v1/heritage?select=*&publie=eq.true'),
    sb('rest/v1/heritage_page?select=image,image_alt,surtitre,titre,texte&id=eq.1'),
  ])
  if (!p.ok || !s.ok) return NextResponse.json({ error: 'catalogue indisponible' }, { status: 502 })
  const produits = ((await p.json()) as Produit[]).map(versSite)
  const signature = ((await s.json()) as Signature[]).map(({ image, alt, titre, texte }) => ({ image, alt, titre, texte }))
  // HÉRITAGE ne doit jamais empêcher la boutique de s'afficher
  const heritage = h.ok ? trierSelections((await h.json()) as Selection[]).map(selectionVersSite) : []
  const pageHeritage = (hp.ok && ((await hp.json()) as PageHeritage[])[0]) || PAGE_HERITAGE_DEFAUT
  // le schéma complet des 8 familles, même vides, pour la barre latérale de la page Héritage
  const familles = FAMILLES.map((f, i) => ({ id: f.id, nom: f.nom, num: String(i + 1).padStart(2, '0') }))
  return NextResponse.json(
    { produits, signature, heritage, familles, pageHeritage },
    { headers: { 'cache-control': 'public, s-maxage=20, stale-while-revalidate=300' } },
  )
}
