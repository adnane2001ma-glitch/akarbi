import type { Metadata } from 'next'
import '../admin/admin.css'
import './compte.css'
import Entete from './Entete'

export const metadata: Metadata = {
  title: 'Mon compte — AKARBI',
  robots: { index: false, follow: false },
}

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin compte">
      <Entete />
      {children}
    </div>
  )
}
