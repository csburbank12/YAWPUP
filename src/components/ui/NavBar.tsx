'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

const TABS = [
  { href: '/feed',     label: 'FEED',     icon: '⬡' },
  { href: '/circles',  label: 'CIRCLES',  icon: '◎' },
  { href: '/discover', label: 'DISCOVER', icon: '◈' },
  { href: '/messages', label: 'MESSAGES', icon: '✉' },
  { href: '/profile',  label: 'PROFILE',  icon: '▲' },
]

export default function NavBar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2A2A2A',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#E8FF47', color: '#0D0D0D',
            fontFamily: "'DM Mono', monospace", fontWeight: 700,
            fontSize: 13, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em'
          }}>YAWP</div>
          <span style={{ color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>beta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#47FFB2' }} />
            <span style={{ color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>no algorithm</span>
          </div>
          {profile && (
            <button onClick={handleSignOut} style={{
              background: 'none', border: '1px solid #2A2A2A', borderRadius: 16,
              color: '#888', fontSize: 12, padding: '4px 12px', cursor: 'pointer'
            }}>Sign out</button>
          )}
        </div>
      </header>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid #2A2A2A',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
      }}>
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 12px', color: active ? '#E8FF47' : '#555',
              transition: 'color 0.15s', textDecoration: 'none'
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
