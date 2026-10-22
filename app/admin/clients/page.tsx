'use client'

import { useEffect, useMemo, useState } from 'react'
import Entete from '../Entete'
import { api } from '../outils'

type Client = {
  id: string; email: string; confirme: boolean; connexion: string; inscrit_le: string; derniere_visite: string | null; newsletter: boolean
  prenom?: string; nom?: string; telephone?: string; date_naissance?: string | null; ville?: string; pays?: string; numero_membre?: number
}

const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export default function Clients() {
  const [clients, setClients] = useState<Client[] | null>(null)
  const [erreur, setErreur] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { api<Client[]>('/api/admin/clients').then(setClients).catch((e) => setErreur(e.message)) }, [])

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!clients || !t) return clients
    return clients.filter((c) => [c.prenom, c.nom, c.email, c.telephone, c.ville, c.pays, c.numero_membre && String(c.numero_membre)].some((v) => v && String(v).toLowerCase().includes(t)))
  }, [clients, q])

  return (
    <>
      <Entete />
      <main className="a-wrap">
        <h1 className="a-h1">Les membres</h1>
        <p className="a-sous">{clients ? `${clients.length} compte${clients.length > 1 ? 's' : ''} client${clients.length > 1 ? 's' : ''}` : 'Chargement…'}</p>
        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
        {clients && clients.length > 0 && (
          <input type="text" placeholder="Rechercher un nom, un email, une ville…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 18 }} />
        )}
        {clients?.length === 0 && <p className="a-aide">Aucun compte client pour l’instant.</p>}
        <div className="a-produits">
          {filtres?.map((c) => (
            <article key={c.id} className="a-produit" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
              <div>
                <h3>{[c.prenom, c.nom].filter(Boolean).join(' ') || 'Profil incomplet'} {c.numero_membre && <span className="a-aide">· N° {String(c.numero_membre).padStart(4, '0')}</span>}</h3>
                <p>{c.email}{c.telephone ? ` · ${c.telephone}` : ''}</p>
                <p>{[c.ville, c.pays].filter(Boolean).join(', ') || '—'}{c.date_naissance ? ` · né(e) le ${date(c.date_naissance)}` : ''}</p>
              </div>
              <div className="a-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span>
                  {!c.confirme && <span className="a-badge a-badge--off">Email non confirmé</span>}
                  {c.newsletter && <span className="a-badge a-badge--on">Newsletter</span>}
                </span>
                <span className="a-aide">Inscrit le {date(c.inscrit_le)} · {c.connexion || 'email'}</span>
                <span className="a-aide">Dernière visite : {date(c.derniere_visite)}</span>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  )
}
