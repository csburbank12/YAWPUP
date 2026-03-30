'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const S = {
  page: {
    minHeight: '100vh', background: '#0D0D0D',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  } as React.CSSProperties,
  box: { width: '100%', maxWidth: 400 } as React.CSSProperties,
  logo: {
    display: 'inline-block', background: '#E8FF47', color: '#0D0D0D',
    fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 18,
    padding: '5px 14px', borderRadius: 8, marginBottom: 12
  } as React.CSSProperties,
  input: {
    width: '100%', background: '#141414', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '12px 16px', color: '#F0F0F0',
    fontSize: 15, outline: 'none'
  } as React.CSSProperties,
  btn: {
    width: '100%', background: '#E8FF47', border: 'none', borderRadius: 10,
    padding: 13, color: '#0D0D0D', fontWeight: 700, fontSize: 15,
    cursor: 'pointer', marginTop: 4
  } as React.CSSProperties,
  error: { color: '#FF6B6B', fontSize: 13 } as React.CSSProperties,
  sub: { textAlign: 'center' as const, color: '#555', fontSize: 13, marginTop: 20 },
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    router.push('/feed')
    router.refresh()
  }

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={S.logo}>YAWP</div>
          <p style={{ color: '#888', fontSize: 14, fontFamily: 'Georgia, serif' }}>
            Welcome back.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={S.input} type="email" placeholder="Email address"
            value={email} required onChange={e => setEmail(e.target.value)}
          />
          <input
            style={S.input} type="password" placeholder="Password"
            value={password} required onChange={e => setPassword(e.target.value)}
          />
          {error && <p style={S.error}>{error}</p>}
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={S.sub}>
          New to Yawp?{' '}
          <Link href="/signup" style={{ color: '#E8FF47' }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
