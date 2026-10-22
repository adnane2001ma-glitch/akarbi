'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Produit } from '@/lib/catalogue'
import { FAMILLES, FORMATS, REPERES_SUGGERES, SELECTION_VIDE, type Selection } from '@/lib/heritage'
import Entete from '../../Entete'
import Photos from '../../Photos'
import { api, slug } from '../../outils'

export default function EditeurSelection() {
  const { id } = useParams<{ id: string }>()
  const nouveau = id === 'nouveau'
  const router = useRouter()
  const [s, setS] = useState<Selection | null>(nouveau ? { ...SELECTION_VIDE } : null)
  const [produits, setProduits] = useState<Produit[]>([])
  const [idManuel, setIdManuel] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [photosEnCours, setPhotosEnCours] = useState(0)

  useEffect(() => {
    api<Produit[]>('/api/admin/produits').then(setProduits).catch(() => {})
    api<Selection[]>('/api/admin/heritage')
      .then((liste) => {
        if (nouveau) {
          const f = FAMILLES.find((x) => x.id === new URLSearchParams(location.search).get('famille'))?.id ?? SELECTION_VIDE.famille
          const ordre = Math.max(0, ...liste.filter((x) => x.famille === f).map((x) => x.ordre)) + 10
          setS((x) => ({ ...x!, famille: f, ordre }))
        } else {
          const trouve = liste.find((x) => x.id === id)
          if (trouve) setS(trouve)
          else setErreur('Cette sélection n’existe pas ou a été supprimée.')
        }
      })
      .catch((e) => setErreur(e.message))
  }, [id, nouveau])

  if (!s) {
    return (
      <>
        <Entete />
        <main className="a-wrap">{erreur ? <p className="a-msg a-msg--erreur" style={{ marginTop: 40 }}>{erreur}</p> : <p className="a-aide" style={{ marginTop: 40 }}>Chargement…</p>}</main>
      </>
    )
  }

  const maj = <K extends keyof Selection>(k: K, v: Selection[K]) =>
    setS((x) => {
      const n = { ...x!, [k]: v }
      if (nouveau && !idManuel && k === 'titre') n.id = slug(String(v))
      return n
    })
  const famille = FAMILLES.find((f) => f.id === s.famille)!
  const reperes = s.reperes
  const lies = produits.filter((p) => p.heritage?.includes(s.id))

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    try {
      if (nouveau) await api('/api/admin/heritage', { method: 'POST', body: JSON.stringify(s) })
      else await api(`/api/admin/heritage/${s!.id}`, { method: 'PUT', body: JSON.stringify(s) })
      router.push('/admin/heritage')
    } catch (err) {
      setErreur((err as Error).message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <Entete />
      <main className="a-wrap">
        <p style={{ marginTop: 28 }}><Link href="/admin/heritage" className="a-aide">← Retour à Héritage</Link></p>
        <h1 className="a-h1" style={{ marginTop: 8 }}>{nouveau ? 'Nouvelle sélection' : s.titre}</h1>
        <p className="a-sous">Les champs laissés vides n’apparaissent pas sur la page de la sélection.</p>

        {erreur && <p className="a-msg a-msg--erreur" role="alert" style={{ marginBottom: 20 }}>{erreur}</p>}

        <form className="a-pile" style={{ gap: 24 }} onSubmit={enregistrer}>
          <section className="a-carte a-pile">
            <h2 className="a-h2">Famille et thème</h2>
            <div className="a-puces" role="group" aria-label="Famille">
              {FAMILLES.map((f, i) => (
                <button key={f.id} type="button" className="a-puce" aria-pressed={s.famille === f.id} onClick={() => maj('famille', f.id)}>{String(i + 1).padStart(2, '0')} · {f.nom}</button>
              ))}
            </div>
            <div className="a-pile" style={{ gap: 8 }}>
              <span className="a-aide">Thème dans « {famille.nom} »</span>
              <div className="a-puces">
                {famille.themes.map((t) => (
                  <button key={t} type="button" className="a-puce" aria-pressed={s.theme === t} onClick={() => maj('theme', s.theme === t ? '' : t)}>{t}</button>
                ))}
              </div>
              <label className="a-champ">
                <span>Ou un autre thème</span>
                <input type="text" maxLength={80} value={s.theme} onChange={(e) => maj('theme', e.target.value)} placeholder="Choisis ci-dessus ou écris le tien" />
                <small>Affiché au-dessus du titre, sur la carte et sur la page.</small>
              </label>
            </div>
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">L’essentiel</h2>
            <div className="a-grille2">
              <label className="a-champ">
                <span>Titre *</span>
                <input type="text" required maxLength={100} value={s.titre} onChange={(e) => maj('titre', e.target.value)} placeholder="Dar Dbagha, El Marsa, Tbourida…" />
              </label>
              <label className="a-champ">
                <span>Adresse de la page</span>
                <input type="text" maxLength={60} value={s.id} disabled={!nouveau} onChange={(e) => { setIdManuel(true); maj('id', slug(e.target.value)) }} />
                <small>{nouveau ? 'Créée automatiquement à partir du titre. Elle ne pourra plus changer ensuite.' : 'Ne peut plus être modifiée.'} akarbi.fr/akarbi/#/heritage/{s.id || '…'}</small>
              </label>
              <label className="a-champ">
                <span>Lieu</span>
                <input type="text" maxLength={80} value={s.lieu} onChange={(e) => maj('lieu', e.target.value)} placeholder="Fès, Haut Atlas, Laâyoune…" />
              </label>
              <label className="a-champ">
                <span>Époque</span>
                <input type="text" maxLength={60} value={s.epoque} onChange={(e) => maj('epoque', e.target.value)} placeholder="XIe siècle, Depuis 1920…" />
              </label>
            </div>
            <label className="a-champ">
              <span>Accroche</span>
              <input type="text" maxLength={200} value={s.accroche} onChange={(e) => maj('accroche', e.target.value)} placeholder="Une phrase, affichée en italique sous le titre." />
            </label>
          </section>

          <section className="a-carte a-pile">
            <div>
              <h2 className="a-h2">Photos</h2>
              <p className="a-aide" style={{ margin: 0 }}>La 1re photo est la couverture : grand format en haut de la page et sur la carte. Les suivantes forment la galerie. Formats horizontaux conseillés.</p>
            </div>
            <div className="a-pile" style={{ gap: 8 }}>
              <span className="a-aide">Format de la carte sur la page Héritage</span>
              <div className="a-puces" role="group" aria-label="Format de la carte">
                {FORMATS.map((f) => (
                  <button key={f.id} type="button" className="a-puce" aria-pressed={(s.format ?? 'auto') === f.id} onClick={() => maj('format', f.id)}>{f.nom}</button>
                ))}
              </div>
              <small className="a-aide">« Automatique » alterne les formats pour donner un rythme décalé à la grille.</small>
            </div>
            <Photos photos={s.photos} onChange={(f) => setS((x) => ({ ...x!, photos: f(x!.photos) }))} roles={['Couverture']} onErreur={setErreur} onEnvoi={setPhotosEnCours} />
            <label className="a-champ">
              <span>Crédit photo</span>
              <input type="text" maxLength={200} value={s.credit} onChange={(e) => maj('credit', e.target.value)} placeholder="Photos : Nom du photographe" />
            </label>
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Le récit</h2>
            <label className="a-champ">
              <span>Texte</span>
              <textarea maxLength={8000} value={s.texte} onChange={(e) => maj('texte', e.target.value)} style={{ minHeight: 220 }} placeholder="L’histoire, le lieu, les gestes, les personnes…" />
              <small>Laisse une ligne vide entre deux paragraphes. Le premier paragraphe est mis en valeur.</small>
            </label>
          </section>

          <section className="a-carte a-pile">
            <div>
              <h2 className="a-h2">Repères</h2>
              <p className="a-aide" style={{ margin: 0 }}>Quelques faits courts, affichés à côté du récit. Un repère sans texte n’est pas affiché.</p>
            </div>
            {reperes.map((r, i) => (
              <div key={i} className="a-pile" style={{ gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--ligne)' }}>
                <div className="a-ligne">
                  <input type="text" maxLength={40} value={r.titre} placeholder="Titre du repère" style={{ flex: 1, minWidth: 180 }} onChange={(e) => maj('reperes', reperes.map((x, k) => (k === i ? { ...x, titre: e.target.value } : x)))} />
                  <button type="button" className="a-btn a-btn--icone" aria-label="Monter" disabled={i === 0} onClick={() => { const l = [...reperes]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; maj('reperes', l) }}>↑</button>
                  <button type="button" className="a-btn a-btn--icone a-btn--danger" aria-label="Supprimer le repère" onClick={() => maj('reperes', reperes.filter((_, k) => k !== i))}>✕</button>
                </div>
                <textarea maxLength={400} value={r.texte} placeholder="Texte du repère" style={{ minHeight: 64 }} onChange={(e) => maj('reperes', reperes.map((x, k) => (k === i ? { ...x, texte: e.target.value } : x)))} />
              </div>
            ))}
            {reperes.length < 8 && (
              <div className="a-ligne">
                <button type="button" className="a-btn" onClick={() => maj('reperes', [...reperes, { titre: '', texte: '' }])}>+ Ajouter un repère</button>
                {REPERES_SUGGERES.filter((t) => !reperes.some((r) => r.titre === t)).map((t) => (
                  <button key={t} type="button" className="a-btn" onClick={() => maj('reperes', [...reperes, { titre: t, texte: '' }])}>+ {t}</button>
                ))}
              </div>
            )}
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Dans l’ADN AKARBI</h2>
            <label className="a-champ">
              <span>Ce qu’AKARBI retient de cet héritage</span>
              <textarea maxLength={1000} value={s.adn} onChange={(e) => maj('adn', e.target.value)} placeholder="Ce que l’on retrouvera dans les prochaines pièces : une matière, un geste, une couleur…" />
              <small>Affiché en grand, sur fond bordeaux, après le récit.</small>
            </label>
          </section>

          <section className="a-carte a-pile">
            <div>
              <h2 className="a-h2">Pièces liées</h2>
              <p className="a-aide" style={{ margin: 0 }}>Le lien se fait depuis la fiche du produit, rubrique « Héritage ». Les pièces en ligne apparaissent sous « Pièces inspirées ».</p>
            </div>
            {nouveau ? (
              <p className="a-aide" style={{ margin: 0 }}>Enregistre d’abord la sélection pour pouvoir y rattacher des pièces.</p>
            ) : lies.length ? (
              <div className="a-liens">
                {lies.map((p) => (
                  <Link key={p.id} href={`/admin/produits/${p.id}`}>
                    {p.photos[0] ? <img src={p.photos[0].url} alt="" /> : <span className="a-vide-img" style={{ width: 40, height: 50 }} />}
                    <span>{p.nom}{p.coloris && ` — ${p.coloris}`}</span>
                    <span className={`a-badge ${p.publie ? 'a-badge--on' : 'a-badge--off'}`} style={{ marginLeft: 'auto' }}>{p.publie ? 'En ligne' : 'Masqué'}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="a-aide" style={{ margin: 0 }}>Aucune pièce liée pour l’instant.</p>
            )}
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Publication</h2>
            <div className="a-ligne" style={{ gap: 24 }}>
              <label className="a-case"><input type="checkbox" checked={s.a_la_une} onChange={(e) => maj('a_la_une', e.target.checked)} /> À la une (en tête de la grille, en format haut)</label>
              <label className="a-case"><input type="checkbox" checked={s.publie} onChange={(e) => maj('publie', e.target.checked)} /> <b>Visible sur le site</b></label>
            </div>
            {!s.publie && <p className="a-aide" style={{ margin: 0 }}>La sélection est enregistrée mais reste invisible pour les visiteurs tant que cette case n’est pas cochée.</p>}
          </section>

          <div className="a-barre-bas">
            <Link href="/admin/heritage" className="a-btn">Annuler</Link>
            <button className="a-btn a-btn--plein" disabled={envoi || photosEnCours > 0}>{envoi ? 'Enregistrement…' : nouveau ? 'Créer la sélection' : 'Enregistrer'}</button>
          </div>
        </form>
      </main>
    </>
  )
}
