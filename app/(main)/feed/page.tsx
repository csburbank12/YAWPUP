import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedClient from '@/components/feed/FeedClient'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles(*),
      hearts!left(user_id),
      echoes!left(user_id)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const postsWithFlags = posts?.map(post => ({
    ...post,
    hearted: post.hearts?.some((h: any) => h.user_id === user.id) ?? false,
    echoed: post.echoes?.some((e: any) => e.user_id === user.id) ?? false,
    hearts: undefined,
    echoes: undefined,
  })) ?? []

  return <FeedClient initialPosts={postsWithFlags} currentUserId={user.id} />
}
