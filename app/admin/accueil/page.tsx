'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Accueil, Ligne, Section, SectionId, Texte } from '@/lib/accueil'
import Entete from '../Entete'
import { api } from '../outils'

// Mise en scène de l'accueil du site : vidéos, textes, positions et moments d'apparition (en secondes de vidéo).
// Chaque modification est enregistrée automatiquement et visible au prochain chargement de l'accueil.

const PARTIES: { id: SectionId; nom: string; aide: string }[] = [
  { id: 'tannerie', nom: 'Ouverture', aide: 'La tannerie, le scarabée révèle AKARBI' },
  { id: 'veste', nom: 'La veste', aide: 'Détail de la veste Signature' },
  { id: 'atelier', nom: 'L’atelier', aide: 'Du geste à la pièce, avec les étapes en bas' },
  { id: 'pa', nom: 'Portraits → ACHIRA', aide: 'Les deux portraits s’ouvrent sur la vidéo ACHIRA' },
  { id: 'coffre', nom: 'Coffre et lettre', aide: 'Le coffre, la lettre, puis TRUST YOUR WAY' },
]
const GENRES: [string, string][] = [
  ['lead-xl', 'Grande phrase'], ['lead', 'Phrase'], ['eyebrow', 'Surtitre'], ['h2', 'Titre'], ['h3', 'Sous-titre'], ['body', 'Texte courant'],
  ['num', 'Numéro d’étape'], ['step-title', 'Titre d’étape'], ['step-txt', 'Texte d’étape'], ['display', 'Très grand titre'], ['motto', 'Devise'], ['link', 'Lien'],
]
const POSITIONS: [string, string][] = [
  ['tl', 'En haut à gauche'], ['t', 'En haut au centre'], ['tr', 'En haut à droite'], ['l', 'À gauche'], ['c', 'Au centre'],
  ['r', 'À droite'], ['bl', 'En bas à gauche'], ['b', 'En bas au centre'], ['br', 'En bas à droite'],
]

const r2 = (x: number) => Math.round(x * 100) / 100
const fmt = (t: number) => `${r2(t).toFixed(2).replace(/\.?0+$/, '')} s`
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const urlVideo = (s: Section) => s.video || `/akarbi/vid/${s.vid}.webm`
// jusqu'où on peut placer un texte : la vidéo, et pour le coffre la lettre qui suit (jusqu'à la déchirure)
const tMax = (id: SectionId, s: Section) => (id === 'coffre' ? r2((s.dur / 0.6) * 0.9) : s.dur)

type Etat = '' | 'attente' | 'envoi' | 'ok' | 'erreur'

export default function AdminAccueil() {
  const [acc, setAcc] = useState<Accueil | null>(null)
  const [origine, setOrigine] = useState<Accueil | null>(null)
  const [source, setSource] = useState('')
  const [sec, setSec] = useState<SectionId>('veste')
  const [t, setT] = useState(0)
  const [sel, setSel] = useState(-1)
  const [etat, setEtat] = useState<Etat>('')
  const [erreur, setErreur] = useState('')
  const [note, setNote] = useState<{ ancienne: number; nouvelle: number } | null>(null)
  const [lecture, setLecture] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    api<{ accueil: Accueil; source: string; origine: Accueil }>('/api/admin/accueil')
      .then((d) => { setAcc(d.accueil); setOrigine(d.origine); setSource(d.source) })
      .catch((e) => setErreur(e.message))
  }, [])

  // enregistrement automatique, regroupé quand on tape
  const enregistrer = useCallback((a: Accueil) => {
    setEtat('attente')
    if (minuteur.current) clearTimeout(minuteur.current)
    minuteur.current = setTimeout(async () => {
      setEtat('envoi')
      try {
        await api('/api/admin/accueil', { method: 'PUT', body: JSON.stringify(a) })
        setEtat('ok')
        setSource('akarbi')
      } catch (e) {
        setEtat('erreur')
        setErreur((e as Error).message)
      }
    }, 700)
  }, [])

  const s = acc?.[sec]
  const max = s ? tMax(sec, s) : 1

  /** modifie la partie affichée puis enregistre */
  const changer = (fn: (s: Section) => void) => {
    if (!acc) return
    const a = clone(acc)
    fn(a[sec])
    setAcc(a)
    setErreur('')
    enregistrer(a)
  }

  // la vidéo suit le curseur
  useEffect(() => {
    const v = video.current
    if (!v || !s || !(v.readyState >= 1)) return
    try { v.currentTime = Math.min(t, Math.max(0, (v.duration || s.dur) - 0.04)) } catch {}
  }, [t, s])

  // lecture de l'aperçu
  useEffect(() => {
    if (!lecture) return
    let raf = 0
    let last = performance.now()
    const pas = (now: number) => {
      setT((x) => {
        const n = x + (now - last) / 1000
        if (n >= max) { setLecture(false); return max }
        return n
      })
      last = now
      raf = requestAnimationFrame(pas)
    }
    raf = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(raf)
  }, [lecture, max])

  const choisirPartie = (id: SectionId) => { setSec(id); setT(0); setSel(-1); setNote(null); setLecture(false); setConfirmer(false) }
  const allerA = (i: number) => {
    if (!s?.ov) return
    const o = s.ov[i]
    setSel(i)
    setT(o.at + Math.min(0.3, ((o.out ?? max) - o.at) / 2))
  }

  const ordre = useMemo(() => (s?.ov ? s.ov.map((o, i) => [o, i] as const).sort((a, b) => a[0].at - b[0].at) : []), [s])

  async function remplacerVideo(f: File) {
    if (!s) return
    if (!/^video\/(webm|mp4)$/.test(f.type)) return setErreur('Choisis une vidéo WebM ou MP4.')
    if (f.size > 50 * 1024 * 1024) return setErreur('La vidéo dépasse 50 Mo.')
    setErreur('')
    setEtat('envoi')
    try {
      // durée et image d'attente lues dans le navigateur, depuis le fichier choisi
      const info = await new Promise<{ dur: number; affiche: Blob | null }>((ok) => {
        const v = document.createElement('video'), u = URL.createObjectURL(f)
        v.muted = true; v.preload = 'auto'; v.src = u
        v.addEventListener('loadeddata', () => {
          const d = v.duration
          v.currentTime = Math.min(0.05, d / 2)
          v.addEventListener('seeked', () => {
            const c = document.createElement('canvas')
            c.width = Math.min(1920, v.videoWidth); c.height = Math.round((c.width * v.videoHeight) / v.videoWidth)
            c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
            c.toBlob((b) => { URL.revokeObjectURL(u); ok({ dur: d, affiche: b }) }, 'image/webp', 0.8)
          }, { once: true })
        }, { once: true })
        v.addEventListener('error', () => { URL.revokeObjectURL(u); ok({ dur: 0, affiche: null }) }, { once: true })
      })
      const envoyer = async (corps: Blob, type: string) => {
        const { envoi, url } = await api<{ envoi: string; url: string }>('/api/admin/accueil/video', { method: 'POST', body: JSON.stringify({ section: sec, type }) })
        const r = await fetch(envoi, { method: 'PUT', headers: { 'content-type': type, 'cache-control': 'max-age=31536000' }, body: corps })
        if (!r.ok) throw new Error(`Envoi refusé par le stockage (${r.status}) : ${await r.text()}`)
        return url
      }
      const url = await envoyer(f, f.type)
      const affiche = info.affiche ? await envoyer(info.affiche, 'image/webp').catch(() => '') : ''
      const ancienne = s.dur
      const nouvelle = info.dur > 0.5 && Number.isFinite(info.dur) ? r2(info.dur) : s.dur
      changer((x) => { x.video = url; x.poster = affiche; x.dur = nouvelle })
      if (Math.abs(ancienne - nouvelle) >= 0.05) setNote({ ancienne, nouvelle })
      setT(0)
    } catch (e) {
      setEtat('erreur')
      setErreur((e as Error).message)
    }
  }

  // une nouvelle durée : on garde les textes aux mêmes endroits de l'histoire (en proportion)
  const adapterMoments = () => {
    if (!note) return
    const k = note.nouvelle / note.ancienne, r = (x: number) => r2(x * k)
    changer((x) => {
      x.ov?.forEach((o) => { o.at = r(o.at); if (o.out != null) o.out = r(o.out) })
      x.rail?.forEach((e) => { e.at = r(e.at) })
      if (x.inset) x.inset = [r(x.inset[0]), r(x.inset[1])]
    })
    setNote(null)
  }

  if (!acc || !s || !origine) {
    return (
      <>
        <Entete />
        <main className="a-wrap">
          <h1 className="a-h1">Accueil</h1>
          {erreur ? <p className="a-msg a-msg--erreur" role="alert">{erreur}</p> : <p className="a-aide">Chargement…</p>}
        </main>
      </>
    )
  }

  const partie = PARTIES.find((p) => p.id === sec)!
  const visibles = (s.ov || []).map((o, i) => [o, i] as const).filter(([o]) => t >= o.at && t < (o.out ?? Infinity))

  return (
    <>
      <Entete />
      <main className="a-wrap a-wrap--large">
        <div className="a-ligne" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="a-h1">Accueil</h1>
            <p className="a-sous" style={{ marginBottom: 0 }}>
              Vidéos, textes, positions et moments d’apparition de l’accueil du site. Chaque modification est enregistrée toute seule et visible
              au prochain chargement de l’accueil. Les moments sont en secondes de vidéo ; sur téléphone, les textes placés à gauche ou à droite passent en bas.
            </p>
          </div>
          <span className={`ak-etat ak-etat--${etat || 'repos'}`} role="status">
            {{ '': source === 'achira' ? 'Réglages repris du dashboard ACHIRA' : source === 'origine' ? 'Mise en scène d’origine' : 'À jour', attente: 'Modification…', envoi: 'Enregistrement…', ok: 'Enregistré', erreur: 'Non enregistré' }[etat]}
          </span>
        </div>

        {erreur && <p className="a-msg a-msg--erreur" role="alert" style={{ marginTop: 16 }}>{erreur}</p>}

        <div className="a-puces" role="group" aria-label="Partie de l’accueil" style={{ margin: '24px 0' }}>
          {PARTIES.map((p) => <button key={p.id} type="button" className="a-puce" aria-pressed={sec === p.id} onClick={() => choisirPartie(p.id)}>{p.nom}</button>)}
          <a className="a-btn" href="/akarbi/index.html#/" target="_blank" rel="noopener" style={{ marginLeft: 'auto' }}>Voir l’accueil ↗</a>
        </div>

        <div className="ak-grille">
          <div className="a-pile">
            <section className="a-carte">
              <div className="a-ligne" style={{ justifyContent: 'space-between' }}>
                <div><h2 className="a-h2" style={{ marginBottom: 4 }}>{partie.nom}</h2><p className="a-aide">{partie.aide}</p></div>
                <span className="ak-horloge">{fmt(t)}</span>
              </div>
              <div className="ak-scene">
                <video key={urlVideo(s)} ref={video} src={urlVideo(s)} poster={s.poster || undefined} muted playsInline preload="auto"
                  onLoadedMetadata={(e) => { try { e.currentTarget.currentTime = Math.min(t, Math.max(0, e.currentTarget.duration - 0.04)) } catch {} }} />
                <div className="ak-ombre" />
                <div className="ak-calque">
                  {visibles.map(([o, i]) => (
                    <div key={i} className={`ak-ov ak-ov--${o.pos}${o.style ? ' ak-ov--etape' : ''}${sel === i ? ' is-sel' : ''}`}>
                      {o.parts.map((p, k) => <span key={k} className={`ak-l ak-l--${p.k}`}>{p.t}{p.k === 'link' ? ' →' : ''}</span>)}
                    </div>
                  ))}
                  {sec === 'tannerie' && (t >= s.dur * 0.9
                    ? <div className="ak-ov ak-ov--c"><span className="ak-l ak-l--marque">AKARBI</span>{(s.after || []).map((p, k) => <span key={k} className={`ak-l ak-l--${p.k}`}>{p.t}</span>)}</div>
                    : <div className="ak-ov ak-ov--b"><span className="ak-l ak-l--lead">{s.cue}</span></div>)}
                  {sec === 'pa' && t < 0.05 && <div className="ak-ov ak-ov--t"><span className="ak-l ak-l--h3">{s.head}</span></div>}
                  {sec === 'pa' && t >= s.dur - 0.05 && <div className="ak-ov ak-ov--c"><span className="a-aide">puis l’écran titre :</span>{(s.title || []).map((p, k) => <span key={k} className={`ak-l ak-l--${p.k}`}>{p.t}</span>)}</div>}
                  {sec === 'coffre' && t > s.dur && <div className="ak-ov ak-ov--c ak-lettre">{(s.letter || []).map((p, k) => <span key={k} className="ak-l ak-l--step-txt">{p}</span>)}<span className="ak-l ak-l--eyebrow">{s.sign}</span></div>}
                </div>
              </div>
              <div className="a-ligne" style={{ marginTop: 12 }}>
                <input type="range" className="ak-curseur" min={0} max={max} step={0.01} value={Math.min(t, max)} onChange={(e) => { setLecture(false); setT(+e.target.value) }} aria-label="Moment de la vidéo" />
                <button type="button" className="a-btn" onClick={() => { if (t >= max - 0.05) setT(0); setLecture(!lecture) }}>{lecture ? 'Pause' : 'Lire'}</button>
              </div>
              {s.ov && <Frise ov={s.ov} max={max} t={t} sel={sel} coffre={sec === 'coffre' ? s.dur : null} allerA={allerA} />}
              <p className="a-aide">Glisse le curseur pour voir la vidéo et les textes à ce moment{sec === 'coffre' ? ' ; après la vidéo vient la lettre, puis la page se déchire sur TRUST YOUR WAY' : ''}.</p>
            </section>

            <section className="a-carte a-pile">
              <h2 className="a-h2">Vidéo</h2>
              <p className="a-aide">
                {s.video ? 'Vidéo remplacée depuis le dashboard.' : `Vidéo d’origine du site (${s.vid}.webm).`} WebM ou MP4, 50 Mo au plus.
                Pour un défilement fluide, la vidéo doit avoir des images clés fréquentes, par exemple
                <code className="ak-code"> ffmpeg -i source.mp4 -an -c:v libvpx-vp9 -g 6 -b:v 4M {s.vid}.webm</code>.
              </p>
              {note && (
                <p className="a-msg a-msg--ok">
                  La vidéo dure maintenant {fmt(note.nouvelle)} (avant {fmt(note.ancienne)}).{' '}
                  <button type="button" className="a-btn" onClick={adapterMoments}>Adapter les moments des textes à la nouvelle durée</button>
                </p>
              )}
              <div className="a-ligne">
                <label className="a-btn a-btn--plein">
                  Remplacer la vidéo
                  <input type="file" accept="video/webm,video/mp4" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) remplacerVideo(f) }} />
                </label>
                {s.video && (
                  <button type="button" className="a-btn" onClick={() => {
                    const d = origine[sec].dur
                    if (Math.abs(s.dur - d) >= 0.05) setNote({ ancienne: s.dur, nouvelle: d })
                    changer((x) => { x.video = ''; x.poster = ''; x.dur = d })
                  }}>Revenir à la vidéo d’origine</button>
                )}
              </div>
              <div className="ak-champs">
                <label className="a-champ">Durée de la vidéo (s)
                  <input type="number" step="0.01" min="0.5" value={s.dur} onChange={(e) => { const v = +e.target.value; if (v > 0) changer((x) => { x.dur = v }) }} />
                  <span className="a-aide">Remplie toute seule quand on dépose une vidéo.</span>
                </label>
                <label className="a-champ">Longueur du défilement (% d’écran)
                  <input type="number" step="10" min="100" value={s.len} onChange={(e) => { const v = +e.target.value; if (v >= 100) changer((x) => { x.len = v }) }} />
                  <span className="a-aide">Plus c’est grand, plus la vidéo avance lentement entre deux textes.</span>
                </label>
                {'inset' in s && (
                  <div className="a-champ">Plan d’ensemble (l’image se réduit puis revient plein cadre)
                    <div className="a-ligne">
                      {[0, 1].map((k) => (
                        <label key={`${sec}-${k}-${s.inset?.[k] ?? ''}`} className="a-aide">{k ? 'à' : 'de'}{' '}
                          <input type="number" step="0.1" style={{ width: 90 }} defaultValue={s.inset?.[k] ?? ''} onBlur={(e) => {
                            const i = [...(s.inset || [NaN, NaN])] as number[]
                            i[k] = e.target.value === '' ? NaN : +e.target.value
                            changer((x) => { x.inset = Number.isFinite(i[0]) && Number.isFinite(i[1]) && i[1] > i[0] ? [i[0], i[1]] : null })
                          }} /> s
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {sec === 'tannerie' && <p className="a-aide">L’ouverture suit le vol du scarabée de la vidéo d’origine pour révéler AKARBI : une nouvelle vidéo garde la même révélation, au même rythme.</p>}
            </section>
          </div>

          <div className="a-pile">
            {sec === 'tannerie' && (
              <>
                <section className="a-carte a-pile">
                  <h2 className="a-h2">Texte sous AKARBI</h2>
                  <p className="a-aide">Apparaît quand AKARBI est révélé, au premier geste du visiteur.</p>
                  <EditeurLignes lignes={s.after || []} defaut="body" onChange={(l) => changer((x) => { x.after = l })} />
                </section>
                <section className="a-carte">
                  <label className="a-champ">Invitation à défiler (au début)
                    <input type="text" value={s.cue || ''} onChange={(e) => changer((x) => { x.cue = e.target.value })} />
                  </label>
                </section>
              </>
            )}
            {sec === 'pa' && (
              <section className="a-carte">
                <label className="a-champ">Titre au-dessus des portraits
                  <input type="text" value={s.head || ''} onChange={(e) => changer((x) => { x.head = e.target.value })} />
                </label>
              </section>
            )}
            {s.ov && (
              <section className="a-carte a-pile">
                <div className="a-ligne" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <h2 className="a-h2" style={{ marginBottom: 4 }}>Textes sur la vidéo</h2>
                    <p className="a-aide">{s.ov.length} textes, dans l’ordre d’apparition. Le visiteur s’arrête sur chacun ; deux textes proches (un à gauche, un à droite) s’affichent ensemble.</p>
                  </div>
                  <button type="button" className="a-btn a-btn--plein" onClick={() => {
                    const at = r2(t)
                    changer((x) => { x.ov!.push({ pos: 'c', at, out: Math.min(max, r2(at + 1.2)), style: '', parts: [{ k: 'lead-xl', t: 'Nouveau texte' }] }) })
                    setSel(s.ov!.length)
                  }}>+ Texte à {fmt(t)}</button>
                </div>
                {ordre.map(([o, i]) => (
                  <CarteTexte key={i} o={o} max={max} t={t} ouvert={sel === i} onOuvrir={() => allerA(i)}
                    onChange={(fn) => changer((x) => fn(x.ov![i]))}
                    onSupprimer={() => { changer((x) => { x.ov!.splice(i, 1) }); setSel(-1) }}
                    onAller={setT} />
                ))}
              </section>
            )}
            {sec === 'atelier' && s.rail && (
              <section className="a-carte a-pile">
                <h2 className="a-h2">Étapes en bas de l’écran</h2>
                <p className="a-aide">L’étape s’allume à partir du moment indiqué.</p>
                {s.rail.map((e, k) => (
                  <div key={k} className="a-ligne">
                    <input type="number" step="0.1" style={{ width: 90 }} value={e.at} onChange={(ev) => changer((x) => { x.rail![k].at = +ev.target.value || 0 })} aria-label="Moment (s)" />
                    <input type="text" value={e.t} onChange={(ev) => changer((x) => { x.rail![k].t = ev.target.value })} aria-label="Nom de l’étape" style={{ flex: 1 }} />
                    <button type="button" className="a-btn a-btn--icone" aria-label="Retirer l’étape" onClick={() => changer((x) => { x.rail!.splice(k, 1) })}>×</button>
                  </div>
                ))}
                <div><button type="button" className="a-btn" onClick={() => changer((x) => { x.rail!.push({ at: Math.round(t * 10) / 10, t: 'Étape' }); x.rail!.sort((a, b) => a.at - b.at) })}>+ Étape à {fmt(t)}</button></div>
              </section>
            )}
            {sec === 'pa' && (
              <section className="a-carte a-pile">
                <h2 className="a-h2">Écran titre ACHIRA</h2>
                <p className="a-aide">Après la vidéo, avant la partie suivante.</p>
                <EditeurLignes lignes={s.title || []} defaut="body" onChange={(l) => changer((x) => { x.title = l })} />
              </section>
            )}
            {sec === 'coffre' && (
              <>
                <section className="a-carte a-pile">
                  <h2 className="a-h2">La lettre</h2>
                  <p className="a-aide">Un paragraphe par ligne. Sur téléphone, elle s’affiche en texte lisible.</p>
                  <textarea rows={7} value={(s.letter || []).join('\n')} onChange={(e) => changer((x) => { x.letter = e.target.value.split('\n') })} aria-label="Paragraphes de la lettre" />
                  <label className="a-champ">Signature<input type="text" value={s.sign || ''} onChange={(e) => changer((x) => { x.sign = e.target.value })} /></label>
                </section>
                <section className="a-carte ak-champs">
                  <label className="a-champ">Grand titre de la page finale<input type="text" value={s.finTitle || ''} onChange={(e) => changer((x) => { x.finTitle = e.target.value })} /></label>
                  <label className="a-champ">Sous le titre<input type="text" value={s.finSub || ''} onChange={(e) => changer((x) => { x.finSub = e.target.value })} /></label>
                </section>
              </>
            )}
            <section className="a-carte a-pile">
              <h2 className="a-h2">Revenir en arrière</h2>
              <p className="a-aide">Remet cette partie comme sur le site d’origine : vidéo, textes, positions et moments.</p>
              <div>
                <button type="button" className={confirmer ? 'a-btn a-btn--danger' : 'a-btn'} onClick={() => {
                  if (!confirmer) return setConfirmer(true)
                  changer((x) => { Object.keys(x).forEach((k) => delete (x as Record<string, unknown>)[k]); Object.assign(x, clone(origine[sec])) })
                  setConfirmer(false); setSel(-1); setNote(null)
                }}>{confirmer ? 'Confirmer : tout remettre comme à l’origine' : `Rétablir l’original de « ${partie.nom} »`}</button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

function Frise({ ov, max, t, sel, coffre, allerA }: { ov: Texte[]; max: number; t: number; sel: number; coffre: number | null; allerA: (i: number) => void }) {
  // une ligne par chevauchement pour que deux textes simultanés restent lisibles
  const rangs: number[] = []
  const blocs = ov.map((o, i) => ({ o, i, a: o.at, b: o.out ?? max })).sort((x, y) => x.a - y.a).map((b) => {
    let r = 0
    while (rangs[r] !== undefined && rangs[r] > b.a + 0.001) r++
    rangs[r] = b.b
    return { ...b, r }
  })
  return (
    <div className="ak-frise" style={{ height: Math.max(1, rangs.length) * 26 + 6 }} aria-label="Textes sur la durée">
      {blocs.map((b) => (
        <button key={b.i} type="button" className={`ak-bloc${sel === b.i ? ' is-sel' : ''}`} onClick={() => allerA(b.i)} title={b.o.parts[0]?.t}
          style={{ left: `${(b.a / max) * 100}%`, width: `${Math.max(1.5, ((b.b - b.a) / max) * 100)}%`, top: b.r * 26 + 3 }}>
          {b.o.parts[0]?.t || 'Texte sans contenu'}
        </button>
      ))}
      {coffre !== null && <span className="ak-repere" style={{ left: `${(coffre / max) * 100}%` }} title="Fin de la vidéo, la lettre">lettre</span>}
      <span className="ak-tete" style={{ left: `${(Math.min(t, max) / max) * 100}%` }} />
    </div>
  )
}

function CarteTexte({ o, max, t, ouvert, onOuvrir, onChange, onSupprimer, onAller }: {
  o: Texte; max: number; t: number; ouvert: boolean; onOuvrir: () => void
  onChange: (fn: (o: Texte) => void) => void; onSupprimer: () => void; onAller: (t: number) => void
}) {
  const fin = o.out === null
  const ici = r2(t)
  return (
    <article className={`ak-carte${ouvert ? ' is-on' : ''}`}>
      <div className="ak-carte__h">
        <button type="button" className="ak-carte__go" onClick={onOuvrir}>
          <b>{o.parts[0]?.t || 'Texte sans contenu'}</b>
          <span className="a-aide">{fmt(o.at)} → {fin ? 'fin' : fmt(o.out!)}</span>
        </button>
        <button type="button" className="a-btn a-btn--icone" aria-label="Supprimer ce texte" onClick={onSupprimer}>×</button>
      </div>
      {ouvert && (
        <div className="a-pile" style={{ gap: 14 }}>
          <div className="ak-pos" role="group" aria-label="Position à l’écran">
            {POSITIONS.map(([p, nom]) => (
              <button key={p} type="button" aria-pressed={o.pos === p} title={nom} aria-label={nom} onClick={() => { onChange((x) => { x.pos = p }); if (t < o.at || (o.out != null && t >= o.out)) onAller(o.at + 0.05) }} />
            ))}
          </div>
          <div className="ak-champs">
            <div className="a-ligne">
              <label className="a-aide">Apparaît à <input type="number" step="0.05" min={0} max={max} value={o.at} style={{ width: 84 }}
                onChange={(e) => onChange((x) => { x.at = Math.max(0, Math.min(max, +e.target.value || 0)); if (x.out != null && x.out <= x.at) x.out = r2(x.at + 0.5) })} /> s</label>
              <button type="button" className="a-btn" onClick={() => onChange((x) => { x.at = ici; if (x.out != null && x.out <= ici) x.out = r2(ici + 0.5) })}>= curseur</button>
            </div>
            <div className="a-ligne">
              <label className="a-aide">Disparaît à <input type="number" step="0.05" min={0} max={max} value={fin ? '' : o.out!} disabled={fin} style={{ width: 84 }}
                onChange={(e) => onChange((x) => { const v = Math.min(max, +e.target.value || 0); x.out = v > x.at ? v : r2(x.at + 0.5) })} /> s</label>
              <button type="button" className="a-btn" disabled={fin} onClick={() => onChange((x) => { x.out = ici > x.at ? ici : r2(x.at + 0.5) })}>= curseur</button>
            </div>
            <label className="a-case"><input type="checkbox" checked={fin} onChange={(e) => onChange((x) => { x.out = e.target.checked ? null : Math.min(max, r2(x.at + 1)) })} /> Reste jusqu’à la fin</label>
            <label className="a-aide">Style{' '}
              <select value={o.style} onChange={(e) => onChange((x) => { x.style = e.target.value as Texte['style'] })}>
                <option value="">Normal</option><option value="step">Étape</option><option value="step-end">Étape finale</option>
              </select>
            </label>
          </div>
          <EditeurLignes lignes={o.parts} defaut="body" onChange={(l) => onChange((x) => { x.parts = l })} />
        </div>
      )}
    </article>
  )
}

function EditeurLignes({ lignes, defaut, onChange }: { lignes: Ligne[]; defaut: string; onChange: (l: Ligne[]) => void }) {
  const maj = (k: number, p: Partial<Ligne>) => onChange(lignes.map((l, i) => {
    if (i !== k) return l
    const n = { ...l, ...p }
    if (n.k === 'link' && !n.href) n.href = '#h-collection'
    return n
  }))
  return (
    <div className="a-pile" style={{ gap: 8 }}>
      {lignes.map((l, k) => (
        <div key={k} className="ak-ligne">
          <select value={l.k} onChange={(e) => maj(k, { k: e.target.value })} aria-label="Style de la ligne">
            {GENRES.map(([g, nom]) => <option key={g} value={g}>{nom}</option>)}
          </select>
          <input type="text" value={l.t} onChange={(e) => maj(k, { t: e.target.value })} aria-label="Texte" />
          {l.k === 'link' && <input type="text" value={l.href || ''} placeholder="#h-collection ou https://…" onChange={(e) => maj(k, { href: e.target.value.trim() })} aria-label="Adresse du lien" />}
          <button type="button" className="a-btn a-btn--icone" aria-label="Retirer la ligne" onClick={() => onChange(lignes.filter((_, i) => i !== k))}>×</button>
        </div>
      ))}
      <div><button type="button" className="a-btn" onClick={() => onChange([...lignes, { k: defaut, t: 'Nouvelle ligne' }])}>+ Ligne</button></div>
    </div>
  )
}
