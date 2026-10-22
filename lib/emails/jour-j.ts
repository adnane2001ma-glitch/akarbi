import { bouton, citation, gabarit, imageEmail, paragraphe, photo, titre } from './theme'

export const SUJET_JOUR_J = 'Le cercle est ouvert.'

export function contenuJourJ(site: string, lienDesinscription: string) {
  const img = (f: string) => imageEmail(site, f)
  const corps = `
${photo(site, img('jour-j-fes.jpg'), 600, 315, 'Fès, ses tanneries, et l’ombre d’où tout commence')}
${titre(img('jour-j-titre.png'), 'Le cercle est ouvert.')}
${paragraphe('Tout commence dans l’ombre.<br>Ce soir, AKARBI ouvre ses portes à tous.')}
${paragraphe('La veste Signature, l’atelier, le coffret et l’histoire d’ACHIRA&nbsp;: le premier chapitre est là, tel qu’il a été pensé.', 16)}
${bouton(site, 'Entrer chez AKARBI')}
${photo(site, img('jour-j-book.jpg'), 600, 777, 'AKARBI, maison marocaine de cuir contemporain — Trust your way')}
${citation('Appartenir avant de posséder.', 'Fès nourrit la matière. Le chemin fait le reste.')}`

  const html = gabarit({ site, sujet: SUJET_JOUR_J, preheader: 'Chapter 01 est ouvert. La veste Signature t’attend.', corps, lienDesinscription })

  const text = `AKARBI — Chapter 01, Première trace

Le cercle est ouvert.

Tout commence dans l’ombre. Ce soir, AKARBI ouvre ses portes à tous.
La veste Signature, l’atelier, le coffret et l’histoire d’ACHIRA : le premier chapitre est là, tel qu’il a été pensé.

Entrer chez AKARBI : ${site}

Appartenir avant de posséder.
Fès nourrit la matière. Le chemin fait le reste.

—
AKARBI, maison marocaine de cuir contemporain.
Se désinscrire : ${lienDesinscription}`

  return { html, text }
}
