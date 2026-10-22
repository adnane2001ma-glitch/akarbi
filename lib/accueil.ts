// Mise en scène de l'accueil AKARBI (vidéos, textes, positions, moments), réglée depuis /admin/accueil.
// Enregistrée dans le stockage Supabase d'AKARBI (bucket « accueil », fichier reglages.json) : pas de table à créer.
import DEFAUT from './accueil-defaut.json'
import { sb } from './supabase'

export const BUCKET = 'accueil'
const FICHIER = 'reglages.json'

export const SECTIONS = ['tannerie', 'veste', 'atelier', 'pa', 'coffre'] as const
export type SectionId = (typeof SECTIONS)[number]

export const GENRES = ['lead-xl', 'lead', 'eyebrow', 'h2', 'h3', 'body', 'num', 'step-title', 'step-txt', 'display', 'motto', 'link'] as const
export const POSITIONS = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'] as const

export type Ligne = { k: string; t: string; href?: string }
export type Texte = { pos: string; at: number; out: number | null; style: '' | 'step' | 'step-end'; parts: Ligne[] }
export type Section = {
  vid: string
  video: string
  poster: string
  dur: number
  len: number
  inset?: [number, number] | null
  ov?: Texte[]
  rail?: { at: number; t: string }[]
  after?: Ligne[]
  cue?: string
  head?: string
  title?: Ligne[]
  letter?: string[]
  sign?: string
  finTitle?: string
  finSub?: string
}
export type Accueil = Record<SectionId, Section>

export const ACCUEIL_DEFAUT = DEFAUT as unknown as Accueil

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const nombre = (x: unknown, d: number, min = 0, max = 1e6) => {
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 1000) / 1000)) : d
}
const texte = (x: unknown, max = 600) => (typeof x === 'string' ? x.slice(0, max) : '')
const lien = (x: unknown) => {
  const h = texte(x, 400).trim()
  return /^(#|\/|https:\/\/)/.test(h) ? h : ''
}
const urlStockage = (x: unknown) => {
  const u = texte(x, 600).trim()
  return /^https:\/\//.test(u) ? u : ''
}

function lignes(x: unknown): Ligne[] {
  if (!Array.isArray(x)) return []
  return x.slice(0, 12).map((p) => {
    const k = (GENRES as readonly string[]).includes(p?.k) ? p.k : 'body'
    const l: Ligne = { k, t: texte(p?.t, 400) }
    if (k === 'link') l.href = lien(p?.href) || '#h-collection'
    return l
  })
}

/** Nettoie une partie reçue du dashboard ; ce qui manque reprend la valeur d'origine. */
function nettoyerSection(id: SectionId, x: Record<string, unknown> | undefined): Section {
  const d = ACCUEIL_DEFAUT[id]
  const s: Section = { ...clone(d), ...(x || {}) } as Section
  const out: Section = {
    vid: d.vid,
    video: urlStockage(s.video),
    poster: urlStockage(s.poster),
    dur: nombre(s.dur, d.dur, 0.5, 600),
    len: nombre(s.len, d.len, 100, 4000),
  }
  if ('inset' in d || 'inset' in s) {
    const i = Array.isArray(s.inset) && s.inset.length === 2 ? s.inset.map((v) => nombre(v, NaN, 0, 600)) : null
    out.inset = i && i.every(Number.isFinite) && i[1] > i[0] ? [i[0], i[1]] : null
  }
  if (Array.isArray(d.ov)) {
    out.ov = (Array.isArray(s.ov) ? s.ov : []).slice(0, 40).map((o: Record<string, unknown> & Partial<Texte>) => {
      const at = nombre(o?.at, 0, 0, 600)
      const brut = o?.out as unknown
      const fin = brut === null || brut === undefined || brut === '' ? null : nombre(brut, at + 1, 0, 600)
      return {
        pos: (POSITIONS as readonly string[]).includes(String(o?.pos)) ? String(o.pos) : 'c',
        at,
        out: fin === null ? null : Math.max(fin, at + 0.05),
        style: o?.style === 'step' || o?.style === 'step-end' ? o.style : '',
        parts: lignes(o?.parts),
      }
    })
  }
  if (Array.isArray(d.rail)) out.rail = (Array.isArray(s.rail) ? s.rail : []).slice(0, 12).map((r) => ({ at: nombre(r?.at, 0, 0, 600), t: texte(r?.t, 60) }))
  if (Array.isArray(d.after)) out.after = lignes(s.after)
  if (typeof d.cue === 'string') out.cue = texte(s.cue, 80)
  if (typeof d.head === 'string') out.head = texte(s.head, 200)
  if (Array.isArray(d.title)) out.title = lignes(s.title)
  if (Array.isArray(d.letter)) out.letter = (Array.isArray(s.letter) ? s.letter : []).slice(0, 12).map((p) => texte(p, 600)).filter(Boolean)
  if (typeof d.sign === 'string') out.sign = texte(s.sign, 120)
  if (typeof d.finTitle === 'string') out.finTitle = texte(s.finTitle, 80)
  if (typeof d.finSub === 'string') out.finSub = texte(s.finSub, 120)
  return out
}

export function nettoyerAccueil(x: unknown): Accueil {
  const src = (x && typeof x === 'object' ? x : {}) as Record<string, Record<string, unknown>>
  return Object.fromEntries(SECTIONS.map((id) => [id, nettoyerSection(id, src[id])])) as Accueil
}

// Réglages faits avant le déménagement, dans le dashboard ACHIRA (lecture publique) : repris tant que
// rien n'a été enregistré depuis le dashboard AKARBI.
const ACHIRA = {
  url: 'https://wscvemgeqyzlojkmrmkb.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzY3ZlbWdlcXl6bG9qa21ybWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NDgzNTIsImV4cCI6MjEwODAyNDM1Mn0.nLc-xcfTEF9cUpudV35eeSIy6nQRgXwi2m2BCTAZQ9I',
}
async function lireAchira(): Promise<unknown | null> {
  try {
    const r = await fetch(`${ACHIRA.url}/rest/v1/site_content?key=eq.akarbi_home&select=value`, {
      headers: { apikey: ACHIRA.key, authorization: `Bearer ${ACHIRA.key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    })
    const j = r.ok ? await r.json() : []
    return j[0]?.value && typeof j[0].value === 'object' ? j[0].value : null
  } catch {
    return null
  }
}

/** Réglages en vigueur, complétés par la mise en scène d'origine. `source` dit d'où ils viennent. */
export async function lireAccueil(): Promise<{ accueil: Accueil; source: 'akarbi' | 'achira' | 'origine' }> {
  // stockage indisponible : on passe aux réglages de secours au lieu de casser l'accueil
  const r = await sb(`storage/v1/object/${BUCKET}/${FICHIER}`, { signal: AbortSignal.timeout(2500) }).catch(() => null)
  if (r?.ok) {
    const j = await r.json().catch(() => null)
    if (j) return { accueil: nettoyerAccueil(j), source: 'akarbi' }
  }
  const ancien = await lireAchira()
  if (ancien) return { accueil: nettoyerAccueil(ancien), source: 'achira' }
  return { accueil: nettoyerAccueil(null), source: 'origine' }
}

/** Crée le bucket public « accueil » s'il n'existe pas encore (vidéos de 50 Mo au plus). */
export async function assurerBucket() {
  const r = await sb(`storage/v1/bucket/${BUCKET}`).catch(() => null)
  if (!r) throw new Error('Le stockage ne répond pas. Réessaie dans un instant.')
  if (r.ok) return
  const c = await sb('storage/v1/bucket', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 50 * 1024 * 1024 }),
  })
  if (!c.ok && c.status !== 409) throw new Error(`Création du stockage impossible : ${await c.text()}`)
}

export async function ecrireAccueil(a: Accueil) {
  await assurerBucket()
  const r = await sb(`storage/v1/object/${BUCKET}/${FICHIER}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-upsert': 'true', 'cache-control': 'no-cache' },
    body: JSON.stringify(a),
  }).catch(() => null)
  if (!r) throw new Error('Le stockage ne répond pas. Réessaie dans un instant.')
  if (!r.ok) throw new Error(`Enregistrement impossible : ${await r.text()}`)
}

export const urlPublique = (chemin: string) => `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${chemin}`
