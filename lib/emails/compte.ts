import { bouton, gabarit, imageEmail, paragraphe, titre } from './theme'

// Modèles pour Supabase Auth : {{ .SiteURL }} et {{ .TokenHash }} sont remplis par Supabase.
const lien = (type: string) => `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}`

export function modelesCompte(site: string) {
  const img = (f: string) => imageEmail(site, f)
  return {
    confirmation: {
      sujet: 'Confirme ton email — AKARBI',
      html: gabarit({
        site,
        sujet: 'Confirme ton email',
        preheader: 'Un clic pour activer ton compte AKARBI.',
        corps: `
${titre(img('compte-titre.png'), 'Confirme ton email.')}
${paragraphe('Ton compte AKARBI est presque prêt.<br>Confirme ton adresse pour entrer dans le cercle.')}
${bouton(lien('email'), 'Confirmer mon email')}
${paragraphe('Le lien est valable 24 heures.', 0)}`,
      }),
    },
    motDePasse: {
      sujet: 'Ton nouveau mot de passe — AKARBI',
      html: gabarit({
        site,
        sujet: 'Nouveau mot de passe',
        preheader: 'Choisis un nouveau mot de passe pour ton compte AKARBI.',
        corps: `
${titre(img('mdp-titre.png'), 'Nouveau mot de passe.')}
${paragraphe('Tu as demandé à changer ton mot de passe.<br>Clique ci-dessous pour en choisir un nouveau.')}
${bouton(lien('recovery'), 'Choisir mon mot de passe')}
${paragraphe('Le lien est valable 1 heure. Si tu n’as rien demandé, ignore cet email : ton mot de passe reste le même.', 0)}`,
      }),
    },
  }
}
