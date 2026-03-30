import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CirclesList from '@/components/circles/CirclesList'

export default async function CirclesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: circles } = await supabase
    .from('circles')
    .select('*')
    .order('member_count', { ascending: false })
    .limit(50)

  return <CirclesList circles={circles ?? []} currentUserId={user.id} />
}
