'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/navigateur'
import { ChampMotDePasse, GOOGLE_SVG, messageAuth, PAYS, suiteDepuis, useGoogleActif } from '../outils'

export default function Page() {
  return (
    <Suspense>
      <Connexion />
    </Suspense>
  )
}

function Connexion() {
  const params = useSearchParams()
  const suite = suiteDepuis(params)
  const [mode, setMode] = useState<'connexion' | 'inscription'>(params.get('mode') === 'inscription' ? 'inscription' : 'connexion')
  const [erreur, setErreur] = useState(params.get('erreur') === 'lien' ? 'Ce lien n’est plus valide. Connecte-toi ou demande un nouveau lien.' : '')
  const [envoi, setEnvoi] = useState(false)
  const deconnecte = params.get('deconnecte') === '1'
  const [aConfirmer, setAConfirmer] = useState('')
  const [f, setF] = useState({ email: '', motDePasse: '', prenom: '', nom: '', telephone: '', date_naissance: '', ville: '', pays: 'Maroc', newsletter: false, accepte: false })
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const googleActif = useGoogleActif()
  const supabase = supabaseNavigateur()
  // déjà connecté : pas besoin de passer par ce formulaire
  useEffect(() => {
    if (!deconnecte) supabase.auth.getSession().then(({ data }) => { if (data.session) location.replace(suite) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retour = (chemin: string) => `${location.origin}${chemin}?suite=${encodeURIComponent(suite)}`

  async function google() {
    setErreur('')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: retour('/auth/callback') } })
    if (error) setErreur(messageAuth(error))
  }

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    const email = f.email.trim().toLowerCase()
    if (mode === 'connexion') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: f.motDePasse })
      setEnvoi(false)
      if (error) return setErreur(messageAuth(error))
      location.href = suite
      return
    }
    if (f.motDePasse.length < 8) {
      setEnvoi(false)
      return setErreur('Le mot de passe doit contenir au moins 8 caractères.')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: f.motDePasse,
      options: {
        emailRedirectTo: retour('/auth/callback'),
        data: {
          prenom: f.prenom.trim(), nom: f.nom.trim(), telephone: f.telephone.trim(), date_naissance: f.date_naissance,
          ville: f.ville.trim(), pays: f.pays.trim(), newsletter: f.newsletter,
        },
      },
    })
    setEnvoi(false)
    if (error) return setErreur(messageAuth(error))
    if (data.session) location.href = suite
    else setAConfirmer(email)
  }

  async function renvoyer() {
    const { error } = await supabase.auth.resend({ type: 'signup', email: aConfirmer, options: { emailRedirectTo: retour('/auth/callback') } })
    setErreur(error ? messageAuth(error) : '')
    if (!error) setAConfirmer(aConfirmer + ' ')
  }

  if (aConfirmer) {
    return (
      <main className="c-auth">
        <h1 className="a-h1">Vérifie ta boîte mail</h1>
        <p className="a-sous">Nous avons envoyé un lien de confirmation à <b>{aConfirmer.trim()}</b>. Clique dessus pour activer ton compte.</p>
        <p className="a-aide" style={{ textAlign: 'center' }}>Rien reçu ? Regarde dans les spams ou l’onglet Promotions.</p>
        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
        {aConfirmer.endsWith(' ') ? <p className="a-msg a-msg--ok" role="status">Un nouveau lien vient de partir.</p> : <button type="button" className="a-btn" onClick={renvoyer}>Renvoyer le lien</button>}
      </main>
    )
  }

  return (
    <main className="c-auth">
      <div className="a-pile" style={{ gap: 8 }}>
        <h1 className="a-h1">{mode === 'connexion' ? 'Bon retour' : 'Rejoins le cercle'}</h1>
        <p className="a-sous">{mode === 'connexion' ? 'Connecte-toi à ton compte AKARBI.' : 'Crée ton compte pour commander, garder tes favoris et suivre tes pièces.'}</p>
      </div>

      {deconnecte && !erreur && <p className="a-msg a-msg--ok" role="status">Tu es déconnecté. À bientôt.</p>}

      <div className="c-onglets" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'connexion'} onClick={() => { setMode('connexion'); setErreur('') }}>Connexion</button>
        <button type="button" role="tab" aria-selected={mode === 'inscription'} onClick={() => { setMode('inscription'); setErreur('') }}>Créer un compte</button>
      </div>

      {googleActif && (
        <>
          <button type="button" className="c-google" onClick={google}>{GOOGLE_SVG} Continuer avec Google</button>
          <p className="c-ou">ou</p>
        </>
      )}

      <form className="a-pile" onSubmit={valider}>
        {mode === 'inscription' && (
          <>
            <div className="a-grille2">
              <label className="a-champ"><span>Prénom</span><input type="text" required maxLength={60} autoComplete="given-name" value={f.prenom} onChange={maj('prenom')} /></label>
              <label className="a-champ"><span>Nom</span><input type="text" required maxLength={60} autoComplete="family-name" value={f.nom} onChange={maj('nom')} /></label>
            </div>
          </>
        )}
        <label className="a-champ"><span>Email</span><input type="email" required maxLength={254} autoComplete="email" inputMode="email" value={f.email} onChange={maj('email')} /></label>
        <ChampMotDePasse label="Mot de passe" value={f.motDePasse} onChange={(v) => setF((x) => ({ ...x, motDePasse: v }))}
          minLength={mode === 'inscription' ? 8 : undefined} autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
          aide={mode === 'inscription' ? '8 caractères minimum.' : undefined} />
        {mode === 'connexion' && <a className="a-aide" href="/compte/mot-de-passe-oublie" style={{ justifySelf: 'end' }}>Mot de passe oublié ?</a>}

        {mode === 'inscription' && (
          <>
            <label className="a-champ"><span>Téléphone</span><input type="tel" required maxLength={30} autoComplete="tel" inputMode="tel" placeholder="+212 6 12 34 56 78" value={f.telephone} onChange={maj('telephone')} /></label>
            <div className="a-grille2">
              <label className="a-champ"><span>Ville</span><input type="text" required maxLength={80} autoComplete="address-level2" value={f.ville} onChange={maj('ville')} /></label>
              <label className="a-champ">
                <span>Pays</span>
                <input type="text" required maxLength={80} list="pays" autoComplete="country-name" value={f.pays} onChange={maj('pays')} />
                <datalist id="pays">{PAYS.map((p) => <option key={p} value={p} />)}</datalist>
              </label>
            </div>
            <label className="a-champ">
              <span>Date de naissance (facultatif)</span>
              <input type="date" max={new Date().toISOString().slice(0, 10)} value={f.date_naissance} onChange={maj('date_naissance')} />
              <small>Pour une attention le jour de ton anniversaire.</small>
            </label>
            <label className="a-case"><input type="checkbox" checked={f.newsletter} onChange={maj('newsletter')} /> <span>Recevoir les nouvelles d’AKARBI par email</span></label>
            <label className="a-case"><input type="checkbox" required checked={f.accepte} onChange={maj('accepte')} /> <span>J’accepte la <a href="/akarbi-gate/confidentialite.html" target="_blank" rel="noopener">politique de confidentialité</a></span></label>
          </>
        )}

        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
        <button className="a-btn a-btn--plein c-plein" disabled={envoi}>{envoi ? 'Un instant…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}</button>
      </form>
    </main>
  )
}
