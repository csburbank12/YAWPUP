import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center'
    }}>
      <div style={{
        display: 'inline-block', background: '#E8FF47', color: '#0D0D0D',
        fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 28,
        padding: '8px 20px', borderRadius: 10, marginBottom: 24
      }}>
        YAWP
      </div>

      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.2,
        maxWidth: 600, marginBottom: 16, color: '#F0F0F0'
      }}>
        Sound your barbaric yawp.
      </h1>

      <p style={{
        color: '#888', fontSize: 18, maxWidth: 480,
        lineHeight: 1.6, marginBottom: 40, fontFamily: 'Georgia, serif'
      }}>
        A text-first, chronological, algorithm-free social network.
        No ads. No outrage machine. Just people saying something worth saying.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/signup" style={{
          background: '#E8FF47', color: '#0D0D0D', fontWeight: 700,
          padding: '13px 28px', borderRadius: 24, fontSize: 15
        }}>
          Join Yawp
        </Link>
        <Link href="/login" style={{
          background: 'none', color: '#F0F0F0', fontWeight: 600,
          padding: '13px 28px', borderRadius: 24, fontSize: 15,
          border: '1px solid #2A2A2A'
        }}>
          Sign in
        </Link>
      </div>

      <div style={{
        display: 'flex', gap: 32, marginTop: 64,
        color: '#555', fontSize: 13, fontFamily: "'DM Mono', monospace"
      }}>
        <span>No algorithm</span>
        <span>No ads</span>
        <span>No follower counts</span>
        <span>Chronological always</span>
      </div>
    </div>
  )
}
