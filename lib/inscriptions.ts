import { jetonDesinscription } from './desinscription'
import { contenuBienvenue, SUJET_BIENVENUE } from './emails/bienvenue'
import { sb } from './supabase'

async function envoyerBienvenue(email: string) {
  const { RESEND_API_KEY, EMAIL_FROM, SITE_URL, DESINSCRIPTION_SECRET } = process.env
  if (!RESEND_API_KEY || !EMAIL_FROM || !SITE_URL || !DESINSCRIPTION_SECRET) return
  const site = SITE_URL.replace(/\/+$/, '')
  const stop = `${site}/api/desinscription?e=${encodeURIComponent(email)}&t=${jetonDesinscription(email, DESINSCRIPTION_SECRET)}`
  const { html, text } = contenuBienvenue(site, stop)
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': `bienvenue-${email}` },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: SUJET_BIENVENUE,
      html,
      text,
      headers: { 'List-Unsubscribe': `<${stop}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  })
  if (!r.ok) console.error('Resend bienvenue', r.status, await r.text())
}

type Origine = { source?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null }

// Ajoute l'email à la liste du cercle. Un nouvel inscrit reçoit l'email de bienvenue.
export async function inscrire(email: string, origine: Origine = {}) {
  // ignore-duplicates : la réponse ne contient la ligne que si l'email est nouveau
  const r = await sb('rest/v1/inscriptions?on_conflict=email&select=id', {
    method: 'POST',
    headers: { 'content-type': 'application/json', prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ email, consentement: true, ...origine }),
  })
  if (!r.ok) throw new Error(`Supabase inscription ${r.status} : ${await r.text()}`)

  if (((await r.json()) as unknown[]).length > 0) {
    try {
      await envoyerBienvenue(email)
    } catch (e) {
      console.error('Resend bienvenue', e)
    }
    return
  }
  await changerConsentement(email, true)
}

export async function changerConsentement(email: string, actif: boolean) {
  const r = await sb(`rest/v1/inscriptions?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify({ consentement: actif }),
  })
  if (!r.ok) throw new Error(`Supabase consentement ${r.status} : ${await r.text()}`)
}

export async function estInscrit(email: string) {
  const r = await sb(`rest/v1/inscriptions?select=consentement&email=eq.${encodeURIComponent(email)}`)
  if (!r.ok) throw new Error(`Supabase ${r.status}`)
  const l = (await r.json()) as { consentement: boolean }[]
  return !!l[0]?.consentement
}
