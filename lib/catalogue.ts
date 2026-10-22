import { urlPhotosPubliques } from './supabase'

export type Photo = { url: string; alt: string }
export type Rubrique = { titre: string; texte: string }

export type Produit = {
  id: string
  nom: string
  nom_carte: string
  coloris: string
  categorie: string
  collection: string
  prix_eur: number | null
  prix_mad: number | null
  couleur: string
  couleur2: string | null
  etiquette: string
  description: string
  details: string[]
  rubriques: Rubrique[]
  tailles: string[]
  note: string
  photos: Photo[]
  homme: boolean
  femme: boolean
  ordre: number
  ordre_femme: number | null
  publie: boolean
  heritage: string[]
}

export type Signature = { position: number; image: string; alt: string; titre: string; texte: string }

export const RUBRIQUES_PAR_DEFAUT: Rubrique[] = [
  { titre: 'Matière et entretien', texte: '' },
  { titre: 'Guide des tailles', texte: '' },
  { titre: 'Livraison et retours', texte: '' },
]

export const PRODUIT_VIDE: Produit = {
  id: '', nom: '', nom_carte: '', coloris: '', categorie: '', collection: 'Chapter 01 — Première trace',
  prix_eur: null, prix_mad: null, couleur: '#12281f', couleur2: null, etiquette: 'Nouveauté',
  description: '', details: [], rubriques: RUBRIQUES_PAR_DEFAUT, tailles: [], note: '',
  photos: [], homme: true, femme: true, ordre: 0, ordre_femme: null, publie: false, heritage: [],
}

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,59}$/
const COULEUR_RE = /^#[0-9a-f]{6}$/i

export type Resultat<T> = { ok: true; valeur: T } | { ok: false; erreur: string }

export const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function prix(v: unknown) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n < 1e7 ? Math.round(n * 100) / 100 : NaN
}

export function urlPhotoAutorisee(url: string) {
  return url.startsWith(urlPhotosPubliques()) || /^\/akarbi\/img\/[\w.-]+$/.test(url)
}

export function photos(v: unknown): Photo[] | null {
  if (!Array.isArray(v) || v.length > 20) return null
  const out: Photo[] = []
  for (const p of v) {
    const url = texte(p?.url, 500)
    if (!urlPhotoAutorisee(url)) return null
    out.push({ url, alt: texte(p?.alt, 200) })
  }
  return out
}

export function nettoyerProduit(x: Record<string, unknown>): Resultat<Produit> {
  const id = texte(x.id, 60)
  if (!ID_RE.test(id)) return { ok: false, erreur: 'L’adresse de la page ne doit contenir que des lettres minuscules, des chiffres et des tirets.' }
  const nom = texte(x.nom, 80)
  if (!nom) return { ok: false, erreur: 'Le nom du produit est obligatoire.' }
  const prix_eur = prix(x.prix_eur), prix_mad = prix(x.prix_mad)
  if (Number.isNaN(prix_eur) || Number.isNaN(prix_mad)) return { ok: false, erreur: 'Un prix n’est pas valide.' }
  const couleur = texte(x.couleur, 7)
  if (!COULEUR_RE.test(couleur)) return { ok: false, erreur: 'La couleur de la pastille n’est pas valide.' }
  const couleur2 = x.couleur2 ? texte(x.couleur2, 7) : null
  if (couleur2 && !COULEUR_RE.test(couleur2)) return { ok: false, erreur: 'La deuxième couleur n’est pas valide.' }
  const ph = photos(x.photos)
  if (!ph) return { ok: false, erreur: 'Une photo n’est pas valide.' }
  const liste = (v: unknown, max: number, long: number) =>
    Array.isArray(v) ? [...new Set(v.map((s) => texte(s, long)).filter(Boolean))].slice(0, max) : []
  const rubriques = Array.isArray(x.rubriques)
    ? x.rubriques
        .map((r) => ({ titre: texte(r?.titre, 60), texte: texte(r?.texte, 3000) }))
        .filter((r) => r.titre && r.texte)
        .slice(0, 10)
    : []

  return {
    ok: true,
    valeur: {
      id,
      nom,
      nom_carte: texte(x.nom_carte, 120),
      coloris: texte(x.coloris, 60),
      categorie: texte(x.categorie, 40),
      collection: texte(x.collection, 80),
      prix_eur,
      prix_mad,
      couleur,
      couleur2,
      etiquette: texte(x.etiquette, 30),
      description: texte(x.description, 3000),
      details: liste(x.details, 20, 200),
      rubriques,
      tailles: liste(x.tailles, 30, 16),
      note: texte(x.note, 300),
      photos: ph,
      homme: x.homme !== false,
      femme: x.femme !== false,
      ordre: Number.isInteger(x.ordre) ? (x.ordre as number) : 0,
      ordre_femme: Number.isInteger(x.ordre_femme) ? (x.ordre_femme as number) : null,
      publie: x.publie === true,
      heritage: liste(x.heritage, 20, 60).filter((h) => ID_RE.test(h)),
    },
  }
}

export function nettoyerSignature(v: unknown): Resultat<Signature[]> {
  if (!Array.isArray(v) || v.length !== 3) return { ok: false, erreur: 'Il faut exactement 3 photos.' }
  const out: Signature[] = []
  for (let i = 0; i < 3; i++) {
    const s = v[i] ?? {}
    const image = texte(s.image, 500)
    if (!urlPhotoAutorisee(image)) return { ok: false, erreur: `La photo ${i + 1} n’est pas valide.` }
    out.push({ position: i + 1, image, alt: texte(s.alt, 200), titre: texte(s.titre, 60), texte: texte(s.texte, 300) })
  }
  return { ok: true, valeur: out }
}

// Forme attendue par le JavaScript de public/akarbi/index.html
export function versSite(p: Produit) {
  const g = p.photos
  return {
    id: p.id,
    name: p.nom,
    cardName: p.nom_carte,
    o: p.ordre,
    of: p.ordre_femme ?? p.ordre,
    color: p.coloris,
    cat: p.categorie,
    coll: p.collection,
    eur: p.prix_eur,
    mad: p.prix_mad,
    swatch: p.couleur2 ? `linear-gradient(180deg,${p.couleur} 50%,${p.couleur2} 50%)` : p.couleur,
    face: g[0]?.url ?? '',
    back: g[1]?.url ?? g[0]?.url ?? '',
    alt: [p.nom, p.coloris].filter(Boolean).join(' '),
    alts: g.map((x) => x.alt),
    gallery: g.map((x) => x.url),
    details: p.details,
    infos: p.rubriques,
    sizes: p.tailles,
    desc: p.description,
    note: p.note,
    tag: p.etiquette,
    homme: p.homme,
    femme: p.femme,
    heritage: p.heritage ?? [],
  }
}
