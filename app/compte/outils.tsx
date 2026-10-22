import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export const PAYS = [
  'Maroc', 'France', 'Belgique', 'Suisse', 'Luxembourg', 'Espagne', 'Portugal', 'Italie', 'Allemagne', 'Pays-Bas',
  'Royaume-Uni', 'Irlande', 'Canada', 'États-Unis', 'Émirats arabes unis', 'Arabie saoudite', 'Qatar', 'Koweït',
  'Tunisie', 'Algérie', 'Égypte', 'Sénégal', 'Côte d’Ivoire', 'Mauritanie', 'Turquie',
]

// Messages d'erreur Supabase traduits pour les clients
export function messageAuth(e: { message?: string; code?: string } | null | undefined) {
  const m = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'Confirme d’abord ton email : clique sur le lien que nous t’avons envoyé.'
  if (m.includes('already registered') || m.includes('user_already_exists')) return 'Un compte existe déjà avec cet email. Connecte-toi.'
  if (m.includes('weak_password') || m.includes('password should be')) return 'Mot de passe trop faible : 8 caractères minimum, avec des lettres et des chiffres.'
  if (m.includes('same_password') || m.includes('different from the old')) return 'Le nouveau mot de passe doit être différent de l’ancien.'
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit') || m.includes('too many')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  if (m.includes('invalid email') || m.includes('email_address_invalid')) return 'Cette adresse email ne semble pas valide.'
  if (m.includes('session_not_found') || m.includes('auth session missing')) return 'Ta session a expiré. Reconnecte-toi.'
  return 'Une erreur est survenue. Réessaie dans un instant.'
}

export const suiteDepuis = (params: URLSearchParams) => {
  const v = params.get('suite')
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/compte'
}

export const GOOGLE_SVG = (
  <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
)

// Champ mot de passe avec bouton pour l'afficher en clair
export function ChampMotDePasse({ label, value, onChange, autoComplete, minLength, aide, autoFocus, required = true }: {
  label: string; value: string; onChange: (v: string) => void; autoComplete: string; minLength?: number; aide?: string; autoFocus?: boolean; required?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="a-champ">
      <span>{label}</span>
      <span className="c-mdp">
        <input type={visible ? 'text' : 'password'} required={required} minLength={minLength} autoComplete={autoComplete} autoFocus={autoFocus}
          autoCapitalize="off" spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="c-mdp__oeil" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </span>
      {aide && <small>{aide}</small>}
    </label>
  )
}

// Google n'apparaît que s'il est activé dans Supabase (Authentication → Sign In / Providers)
export function useGoogleActif() {
  const [actif, setActif] = useState(false)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! } })
      .then((r) => r.json())
      .then((s) => setActif(!!s?.external?.google))
      .catch(() => {})
  }, [])
  return actif
}
