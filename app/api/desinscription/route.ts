import { jetonValide } from '@/lib/desinscription'

async function desinscrire(req: Request) {
  const q = new URL(req.url).searchParams
  const email = (q.get('e') ?? '').trim().toLowerCase()
  const jeton = q.get('t') ?? ''
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, DESINSCRIPTION_SECRET: secret } = process.env
  if (!url || !key || !secret) return 'config'
  if (!email || !jetonValide(email, jeton, secret)) return 'invalide'

  const r = await fetch(`${url}/rest/v1/inscriptions?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      ...(key.startsWith('eyJ') ? { authorization: `Bearer ${key}` } : {}),
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({ consentement: false }),
  })
  return r.ok ? 'ok' : 'db'
}

const TEXTES = {
  ok: ['Tu es désinscrit.', 'Tu ne recevras plus nos emails.'],
  invalide: ['Lien invalide.', 'Ce lien de désinscription ne fonctionne pas. Écris-nous et nous te retirerons de la liste.'],
  config: ['Un problème est survenu.', 'Réessaie un peu plus tard.'],
  db: ['Un problème est survenu.', 'Réessaie un peu plus tard.'],
} as const

export async function GET(req: Request) {
  const [titre, texte] = TEXTES[await desinscrire(req)]
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>AKARBI</title>
<style>html,body{margin:0;min-height:100%;background:#050f0c;color:#eee5d3}body{display:grid;place-items:center;min-height:100svh;padding:24px;box-sizing:border-box;font:400 16px/1.6 system-ui,sans-serif;text-align:center}h1{font:italic 400 34px/1.2 Georgia,serif;margin:0 0 10px}p{margin:0;color:rgba(238,229,211,.75)}</style>
</head><body><main><h1>${titre}</h1><p>${texte}</p></main></body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

// désinscription « un clic » des messageries (en-tête List-Unsubscribe-Post)
export async function POST(req: Request) {
  const res = await desinscrire(req)
  return new Response(null, { status: res === 'ok' ? 200 : 400 })
}
