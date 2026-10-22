'use client'

import Link from 'next/link'

export default function Entete() {
  async function deconnexion() {
    await fetch('/api/admin/connexion', { method: 'DELETE' })
    location.href = '/admin/connexion'
  }
  return (
    <header className="a-top">
      <Link href="/admin" className="a-marque"><b>AKARBI</b><span>Dashboard</span></Link>
      <nav>
        <Link className="a-btn" href="/admin">Produits</Link>
        <Link className="a-btn" href="/admin/heritage">Héritage</Link>
        <Link className="a-btn" href="/admin/accueil">Accueil</Link>
        <Link className="a-btn" href="/admin/clients">Membres</Link>
        <a className="a-btn" href="/akarbi/index.html#/produits" target="_blank" rel="noopener">Voir le site</a>
        <button type="button" className="a-btn" onClick={deconnexion}>Déconnexion</button>
      </nav>
    </header>
  )
}
