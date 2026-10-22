import { ID_RE, photos, texte, urlPhotoAutorisee, type Photo, type Resultat } from './catalogue'

// Les 8 familles de la page HÉRITAGE, dans l'ordre d'affichage. Les thèmes sont des suggestions : on peut en écrire un autre.
export const FAMILLES = [
  { id: 'artisanat', nom: 'Artisanat marocain', themes: ['Tannerie et travail du cuir', 'Poterie et céramique', 'Zellige et mosaïque', 'Bois sculpté et marqueterie', 'Métaux : cuivre, laiton et ferronnerie', 'Tissage et tapis', 'Vannerie', 'Bijoux traditionnels'] },
  { id: 'patrimoine', nom: 'Patrimoine marocain', themes: ['Kasbahs', 'Ksour', 'Médinas et quartiers historiques', 'Remparts et portes anciennes', 'Palais et demeures historiques', 'Riads et maisons traditionnelles', 'Greniers collectifs — igoudar', 'Sites archéologiques', 'Monuments religieux et spirituels'] },
  { id: 'maritime', nom: 'Patrimoine maritime', themes: ['Ports et anciens ports', 'Villages de pêcheurs', 'Barques et construction navale traditionnelle', 'Techniques et métiers de la pêche', 'Phares et repères côtiers', 'Fortifications et monuments du littoral', 'Traditions et mémoire des communautés maritimes'] },
  { id: 'histoire', nom: 'Histoire marocaine', themes: ['Personnages historiques', 'Dynasties et grandes périodes', 'Événements marquants', 'Histoire des villes et des régions', 'Routes commerciales et échanges', 'Archives, manuscrits et témoignages'] },
  { id: 'nature', nom: 'Nature marocaine', themes: ['Montagnes et vallées', 'Déserts et dunes', 'Oasis et palmeraies', 'Forêts et espaces naturels', 'Cascades, sources et cours d’eau', 'Lacs et zones humides', 'Littoral, plages et falaises', 'Faune et flore'] },
  { id: 'broderie', nom: 'Broderie et tenues marocaines', themes: ['Caftan', 'Takchita', 'Djellaba', 'Broderies traditionnelles', 'Tenues régionales', 'Accessoires et parures', 'Savoir-faire de confection'] },
  { id: 'culture', nom: 'Culture marocaine', themes: ['Tbourida / Fantasia', 'Moussem et fêtes traditionnelles', 'Coutumes et cérémonies', 'Traditions orales et contes', 'Gastronomie et rituels culinaires', 'Jeux et pratiques populaires', 'Modes de vie et traditions régionales'] },
  { id: 'art', nom: 'Art marocain', themes: ['Peinture', 'Sculpture', 'Photographie', 'Calligraphie', 'Musique et chant', 'Danse et arts de la scène', 'Cinéma et arts audiovisuels'] },
] as const

export type FamilleId = (typeof FAMILLES)[number]['id']
export type Repere = { titre: string; texte: string }

// Format de la carte dans la grille de la page Héritage. « auto » alterne les formats pour un rythme décalé.
export const FORMATS = [
  { id: 'auto', nom: 'Automatique' },
  { id: 'portrait', nom: 'Portrait' },
  { id: 'haut', nom: 'Haut' },
  { id: 'carre', nom: 'Carré' },
  { id: 'paysage', nom: 'Paysage' },
] as const
export type Format = (typeof FORMATS)[number]['id']

export type Selection = {
  id: string
  titre: string
  famille: FamilleId
  theme: string
  lieu: string
  epoque: string
  accroche: string
  texte: string
  reperes: Repere[]
  adn: string
  photos: Photo[]
  credit: string
  format: Format
  a_la_une: boolean
  ordre: number
  publie: boolean
}

export const SELECTION_VIDE: Selection = {
  id: '', titre: '', famille: 'artisanat', theme: '', lieu: '', epoque: '', accroche: '', texte: '',
  reperes: [], adn: '', photos: [], credit: '', format: 'auto', a_la_une: false, ordre: 0, publie: false,
}

export const REPERES_SUGGERES = ['Matière', 'Geste', 'Couleurs', 'À savoir']

export const rangFamille = (id: string) => FAMILLES.findIndex((f) => f.id === id)
export const nomFamille = (id: string) => FAMILLES.find((f) => f.id === id)?.nom ?? ''

export const trierSelections = (l: Selection[]) =>
  [...l].sort((a, b) => rangFamille(a.famille) - rangFamille(b.famille) || a.ordre - b.ordre || a.titre.localeCompare(b.titre, 'fr'))

export function nettoyerSelection(x: Record<string, unknown>): Resultat<Selection> {
  const id = texte(x.id, 60)
  if (!ID_RE.test(id)) return { ok: false, erreur: 'L’adresse de la page ne doit contenir que des lettres minuscules, des chiffres et des tirets.' }
  const titre = texte(x.titre, 100)
  if (!titre) return { ok: false, erreur: 'Le titre de la sélection est obligatoire.' }
  const famille = FAMILLES.find((f) => f.id === x.famille)?.id
  if (!famille) return { ok: false, erreur: 'Choisis une famille.' }
  const ph = photos(x.photos)
  if (!ph) return { ok: false, erreur: 'Une photo n’est pas valide.' }
  const reperes = Array.isArray(x.reperes)
    ? x.reperes
        .map((r) => ({ titre: texte(r?.titre, 40), texte: texte(r?.texte, 400) }))
        .filter((r) => r.titre && r.texte)
        .slice(0, 8)
    : []

  return {
    ok: true,
    valeur: {
      id,
      titre,
      famille,
      theme: texte(x.theme, 80),
      lieu: texte(x.lieu, 80),
      epoque: texte(x.epoque, 60),
      accroche: texte(x.accroche, 200),
      texte: texte(x.texte, 8000),
      reperes,
      adn: texte(x.adn, 1000),
      photos: ph,
      credit: texte(x.credit, 200),
      format: FORMATS.find((f) => f.id === x.format)?.id ?? 'auto',
      a_la_une: x.a_la_une === true,
      ordre: Number.isInteger(x.ordre) ? (x.ordre as number) : 0,
      publie: x.publie === true,
    },
  }
}

// Forme attendue par le JavaScript de public/akarbi/index.html
export function selectionVersSite(s: Selection) {
  const rang = rangFamille(s.famille)
  return {
    id: s.id,
    titre: s.titre,
    famille: s.famille,
    familleNom: nomFamille(s.famille),
    num: String(rang + 1).padStart(2, '0'),
    theme: s.theme,
    lieu: s.lieu,
    epoque: s.epoque,
    accroche: s.accroche,
    texte: s.texte,
    reperes: s.reperes,
    adn: s.adn,
    photos: s.photos,
    credit: s.credit,
    format: s.format ?? 'auto',
    une: s.a_la_une,
  }
}

// En-tête de la page Héritage (une seule ligne en base)
export type PageHeritage = { image: string; image_alt: string; surtitre: string; titre: string; texte: string }

export const PAGE_HERITAGE_DEFAUT: PageHeritage = {
  image: '/akarbi/img/u-tannerie.webp',
  image_alt: 'Un artisan travaille une peau au milieu des cuves de la tannerie',
  surtitre: 'Héritage',
  titre: 'Ce qui nous précède.',
  texte: 'Des gestes, des lieux, des mémoires : le Maroc qui nourrit l’identité d’AKARBI. Huit familles pour le raconter, une sélection après l’autre.',
}

export function nettoyerPageHeritage(x: Record<string, unknown>): Resultat<PageHeritage> {
  const image = texte(x.image, 500)
  if (!urlPhotoAutorisee(image)) return { ok: false, erreur: 'L’image n’est pas valide.' }
  const titre = texte(x.titre, 80)
  if (!titre) return { ok: false, erreur: 'Le titre est obligatoire.' }
  return { ok: true, valeur: { image, image_alt: texte(x.image_alt, 200), surtitre: texte(x.surtitre, 40), titre, texte: texte(x.texte, 400) } }
}
