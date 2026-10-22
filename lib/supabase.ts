export function sb(chemin: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return fetch(`${url}/${chemin}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: key,
      // les clés sb_secret_ ne sont pas des JWT : seul l'en-tête apikey est accepté
      ...(key.startsWith('eyJ') ? { authorization: `Bearer ${key}` } : {}),
      ...init.headers,
    },
  })
}

export const urlPhotosPubliques = () => `${process.env.SUPABASE_URL}/storage/v1/object/public/catalogue/`
