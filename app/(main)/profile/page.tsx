import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/profile/ProfileClient'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profile:profiles(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', user.id)

  return (
    <ProfileClient
      profile={profile}
      posts={posts ?? []}
      postCount={postCount ?? 0}
      followingCount={followingCount ?? 0}
    />
  )
}
<button
  onClick={async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithPassword({
      email: 'demo@yawp.social',
      password: 'yawpdemo123'
    })
    window.location.href = '/feed'
  }}
  style={{
    background: 'none', color: '#888',
    border: '1px solid #2A2A2A',
    padding: '13px 28px', borderRadius: 24,
    fontSize: 15, cursor: 'pointer'
  }}
>
  Try demo
</button>
