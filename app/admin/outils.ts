'use client'

export async function api<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: init.body && !(init.body instanceof FormData) ? { 'content-type': 'application/json', ...init.headers } : init.headers,
  })
  if (r.status === 401) {
    location.href = '/admin/connexion'
    throw new Error('Session expirée, reconnecte-toi.')
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || `Erreur ${r.status}`)
  return data as T
}

// Réduit la photo dans le navigateur avant l'envoi (téléphones : photos de 5 à 15 Mo).
async function redimensionner(fichier: File, max = 2000): Promise<Blob> {
  const img = await createImageBitmap(fichier)
  const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k)
  c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  const vers = (type: string) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, 0.86))
  const webp = await vers('image/webp')
  // Safari ne sait pas toujours produire du WebP : il renvoie alors du PNG
  if (webp && webp.type === 'image/webp') return webp
  return (await vers('image/jpeg'))!
}

export async function envoyerPhoto(fichier: File): Promise<string> {
  const blob = await redimensionner(fichier)
  const fd = new FormData()
  fd.append('photo', blob, blob.type === 'image/webp' ? 'photo.webp' : 'photo.jpg')
  const { url } = await api<{ url: string }>('/api/admin/photos', { method: 'POST', body: fd })
  return url
}

export const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export const formatPrix = (eur: number | null, mad: number | null) =>
  [eur != null ? `${eur.toLocaleString('fr-FR')} €` : '', mad != null ? `${mad.toLocaleString('fr-FR')} MAD` : '']
    .filter(Boolean)
    .join(' · ') || 'Prix non renseigné'

export const GAMMES_TAILLES = [
  { nom: 'Vêtements', tailles: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { nom: 'Pantalons', tailles: ['36', '38', '40', '42', '44', '46', '48'] },
  { nom: 'Bagues', tailles: ['48', '50', '52', '54', '56', '58', '60', '62', '64'] },
  { nom: 'Chaussures', tailles: ['39', '40', '41', '42', '43', '44', '45', '46'] },
  { nom: 'Sans taille', tailles: ['Taille unique'] },
]

export const CATEGORIES = ['Vestes', 'Blousons', 'T-shirts', 'Chemises', 'Sweats', 'Pantalons', 'Bagues', 'Colliers', 'Bracelets', 'Ceintures', 'Sacs', 'Accessoires']
