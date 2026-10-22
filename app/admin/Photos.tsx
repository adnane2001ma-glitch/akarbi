'use client'

import { useState } from 'react'
import type { Photo } from '@/lib/catalogue'
import { envoyerPhoto } from './outils'

// Envoi, ordre, retrait et description des photos. roles : étiquettes des premières photos.
export default function Photos({ photos, onChange, roles = [], max = 20, onErreur, onEnvoi }: {
  photos: Photo[]
  onChange: (f: (l: Photo[]) => Photo[]) => void
  roles?: string[]
  max?: number
  onErreur: (m: string) => void
  onEnvoi?: (n: number) => void
}) {
  const [enCours, setEnCours] = useState(0)
  const compter = (n: number) => { setEnCours(n); onEnvoi?.(n) }

  async function ajouter(fichiers: FileList | null) {
    if (!fichiers?.length) return
    onErreur('')
    const liste = [...fichiers].slice(0, max - photos.length)
    let reste = liste.length
    compter(reste)
    for (const f of liste) {
      try {
        const url = await envoyerPhoto(f)
        onChange((l) => [...l, { url, alt: '' }])
      } catch (e) {
        onErreur(`${f.name} : ${(e as Error).message}`)
      }
      compter(--reste)
    }
  }
  const deplacer = (i: number, d: number) =>
    onChange((l) => {
      const n = [...l]
      ;[n[i], n[i + d]] = [n[i + d], n[i]]
      return n
    })

  return (
    <div className="a-photos">
      {photos.map((ph, i) => (
        <div key={ph.url} className="a-photo">
          <div className="a-photo__img">
            <img src={ph.url} alt="" />
            {roles[i] && <span className="a-photo__role">{roles[i]}</span>}
          </div>
          <div className="a-ligne" style={{ gap: 6 }}>
            <button type="button" className="a-btn a-btn--icone" aria-label="Avancer" disabled={i === 0} onClick={() => deplacer(i, -1)}>←</button>
            <button type="button" className="a-btn a-btn--icone" aria-label="Reculer" disabled={i === photos.length - 1} onClick={() => deplacer(i, 1)}>→</button>
            <button type="button" className="a-btn a-btn--icone a-btn--danger" aria-label="Retirer la photo" onClick={() => onChange((l) => l.filter((_, k) => k !== i))}>✕</button>
          </div>
          <input type="text" maxLength={200} value={ph.alt} placeholder="Description de la photo" onChange={(e) => onChange((l) => l.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} />
        </div>
      ))}
      {photos.length < max && (
        <label className="a-ajout" style={{ position: 'relative' }}>
          {enCours ? `Envoi de ${enCours} photo${enCours > 1 ? 's' : ''}…` : '+ Ajouter des photos'}
          <input type="file" accept="image/*" multiple disabled={enCours > 0} onChange={(e) => { ajouter(e.target.files); e.target.value = '' }} />
        </label>
      )}
    </div>
  )
}
