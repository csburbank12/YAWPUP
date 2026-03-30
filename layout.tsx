import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/ui/NavBar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D' }}>
      <NavBar profile={profile} />
      <main style={{ paddingBottom: 80 }}>
        {children}
      </main>
    </div>
  )
}
