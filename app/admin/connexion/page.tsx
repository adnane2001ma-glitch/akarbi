'use client'

import { useState } from 'react'

export default function Connexion() {
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    const r = await fetch('/api/admin/connexion', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ motDePasse }),
    }).catch(() => null)
    setEnvoi(false)
    if (r?.ok) location.href = '/admin'
    else setErreur(r?.status === 401 ? 'Mot de passe incorrect.' : 'Connexion impossible. Réessaie.')
  }

  return (
    <main className="a-connexion">
      <form onSubmit={valider}>
        <p className="a-h2" style={{ margin: 0 }}>AKARBI · Dashboard</p>
        <h1 className="a-h1" style={{ margin: 0 }}>Entrer dans l’atelier</h1>
        <label className="a-champ" style={{ textAlign: 'left' }}>
          <span>Mot de passe</span>
          <input type="password" autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoFocus required />
        </label>
        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
        <button className="a-btn a-btn--plein" disabled={envoi || !motDePasse}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </main>
  )
}
