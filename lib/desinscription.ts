import { createHmac, timingSafeEqual } from 'node:crypto'

export function jetonDesinscription(email: string, secret: string) {
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('base64url')
}

export function jetonValide(email: string, jeton: string, secret: string) {
  const attendu = Buffer.from(jetonDesinscription(email, secret))
  const recu = Buffer.from(jeton)
  return attendu.length === recu.length && timingSafeEqual(attendu, recu)
}
