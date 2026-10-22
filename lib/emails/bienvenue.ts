import { OUVERTURE } from '../lancement'
import { bouton, citation, gabarit, imageEmail, paragraphe, photo, titre } from './theme'

export const SUJET_BIENVENUE = 'Tu es dans le cercle.'

export function contenuBienvenue(site: string, lienDesinscription: string, maintenant = Date.now()) {
  const img = (f: string) => imageEmail(site, f)

  let suite: string, suiteTexte: string, cta = ''
  if (maintenant < OUVERTURE) {
    suite = 'Le mardi 1er décembre à 20 h, AKARBI ouvre ses portes.<br>On te prévient ici, à la seconde où elles s’ouvrent.'
    suiteTexte = 'Le mardi 1er décembre à 20 h, AKARBI ouvre ses portes. On te prévient ici, à la seconde où elles s’ouvrent.'
  } else {
    suite = 'Les portes sont ouvertes. Le premier chapitre t’attend.'
    suiteTexte = suite
    cta = bouton(site, 'Entrer chez AKARBI')
  }

  const corps = `
${titre(img('bienvenue-titre.png'), 'Tu es dans le cercle.')}
${paragraphe('Ils ne se connaissent pas.<br>Ils portent le même signe.<br>Désormais, toi aussi.')}
${paragraphe(suite, 16)}
${cta || '<tr><td style="padding:0 0 46px;font-size:0;line-height:0">&nbsp;</td></tr>'}
${photo(site, img('bienvenue-lil-achira.jpg'), 600, 600, 'Lil Achira — Trust your way')}
${citation('Un cercle qui avance ensemble.', 'Appartenir avant de posséder.')}`

  const html = gabarit({ site, sujet: SUJET_BIENVENUE, preheader: 'Ton nom est inscrit. Le premier chapitre arrive.', corps, lienDesinscription })

  const text = `AKARBI — Chapter 01, Première trace

Tu es dans le cercle.

Ils ne se connaissent pas. Ils portent le même signe. Désormais, toi aussi.

${suiteTexte}
${cta ? `\nEntrer chez AKARBI : ${site}\n` : ''}
Un cercle qui avance ensemble.
Appartenir avant de posséder.

—
AKARBI, maison marocaine de cuir contemporain.
Se désinscrire : ${lienDesinscription}`

  return { html, text }
}
