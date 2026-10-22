import { createHash } from 'node:crypto'
import { jetonDesinscription } from '@/lib/desinscription'
import { contenuJourJ, SUJET_JOUR_J } from '@/lib/emails/jour-j'
import { OUVERTURE } from '@/lib/lancement'

export const maxDuration = 300

const AVANCE_MAX = 10 * 60e3
const RETARD_MAX = 3 * 864e5

type Inscrit = { id: number; email: string }

export async function GET(req: Request) {
  const env = process.env
  const manquants = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'EMAIL_FROM', 'SITE_URL', 'DESINSCRIPTION_SECRET', 'CRON_SECRET'].filter((k) => !env[k])
  if (manquants.length) return Response.json({ error: 'config', manquants }, { status: 500 })
  if (req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 })

  const site = env.SITE_URL!.replace(/\/+$/, '')
  const sbKey = env.SUPABASE_SERVICE_ROLE_KEY!
  const sb = (chemin: string, init: RequestInit = {}) =>
    fetch(`${env.SUPABASE_URL}/rest/v1/${chemin}`, {
      ...init,
      headers: {
        apikey: sbKey,
        ...(sbKey.startsWith('eyJ') ? { authorization: `Bearer ${sbKey}` } : {}),
        'content-type': 'application/json',
        ...init.headers,
      },
    })

  const message = (email: string) => {
    const stop = `${site}/api/desinscription?e=${encodeURIComponent(email)}&t=${jetonDesinscription(email, env.DESINSCRIPTION_SECRET!)}`
    const { html, text } = contenuJourJ(site, stop)
    return {
      from: env.EMAIL_FROM,
      to: [email],
      subject: SUJET_JOUR_J,
      html,
      text,
      headers: { 'List-Unsubscribe': `<${stop}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }
  }

  const envoyerLot = async (lot: Inscrit[]) => {
    const cle = 'jour-j-' + createHash('sha256').update(lot.map((i) => i.id).join(',')).digest('hex').slice(0, 32)
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': cle },
      body: JSON.stringify(lot.map((i) => message(i.email))),
    })
    if (!r.ok) throw new Error(`Resend ${r.status} : ${await r.text()}`)
  }

  const test = new URL(req.url).searchParams.get('test')
  if (test) {
    await envoyerLot([{ id: -Date.now(), email: test.trim().toLowerCase() }])
    return Response.json({ ok: true, test })
  }

  const maintenant = Date.now()
  if (maintenant < OUVERTURE - AVANCE_MAX || maintenant > OUVERTURE + RETARD_MAX) {
    return Response.json({ ok: true, ignore: 'hors de la fenêtre du jour J' })
  }

  let envoyes = 0
  for (;;) {
    const r = await sb('inscriptions?select=id,email&consentement=eq.true&jour_j_le=is.null&order=id&limit=100')
    if (!r.ok) return Response.json({ error: `Supabase ${r.status}`, detail: await r.text(), envoyes }, { status: 502 })
    const lot: Inscrit[] = await r.json()
    if (!lot.length) break

    try {
      await envoyerLot(lot)
    } catch (e) {
      console.error('Jour J', e)
      return Response.json({ error: String(e), envoyes }, { status: 502 })
    }
    const m = await sb(`inscriptions?id=in.(${lot.map((i) => i.id).join(',')})`, {
      method: 'PATCH',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ jour_j_le: new Date().toISOString() }),
    })
    if (!m.ok) return Response.json({ error: `Supabase ${m.status} (marquage)`, envoyes }, { status: 502 })
    envoyes += lot.length
    if (lot.length < 100) break
  }

  console.log(`Jour J : ${envoyes} email(s) envoyé(s)`)
  return Response.json({ ok: true, envoyes })
}
