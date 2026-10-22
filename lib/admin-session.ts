// Web Crypto : fonctionne aussi bien dans proxy.ts que dans les routes API.
export const COOKIE_ADMIN = 'akarbi-admin'
export const DUREE_SESSION = 7 * 864e5

const enc = new TextEncoder()

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function signer(valeur: string) {
  const cle = await crypto.subtle.importKey('raw', enc.encode(process.env.ADMIN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', cle, enc.encode(valeur)))
}

function egal(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

export async function creerSession() {
  const exp = Date.now() + DUREE_SESSION
  return `${exp}.${await signer('admin:' + exp)}`
}

export async function sessionValide(valeur: string | undefined) {
  if (!valeur || !process.env.ADMIN_SECRET) return false
  const [exp, sig] = valeur.split('.')
  if (!exp || !sig || !(Number(exp) > Date.now())) return false
  return egal(await signer('admin:' + exp), sig)
}

export async function motDePasseCorrect(saisi: string) {
  const attendu = process.env.ADMIN_PASSWORD
  if (!attendu) return false
  const h = async (s: string) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)))
  return egal(await h(saisi), await h(attendu))
}
