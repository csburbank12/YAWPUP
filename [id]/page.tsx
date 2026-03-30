import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ThreadClient from '@/components/feed/ThreadClient'

interface Props {
  params: { id: string }
}

export default async function PostPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the post
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles(*),
      hearts!left(user_id),
      echoes!left(user_id)
    `)
    .eq('id', params.id)
    .single()

  if (!post) notFound()

  const enrichedPost = {
    ...post,
    hearted: post.hearts?.some((h: any) => h.user_id === user.id) ?? false,
    echoed: post.echoes?.some((e: any) => e.user_id === user.id) ?? false,
    hearts: undefined,
    echoes: undefined,
  }

  // Fetch replies
  const { data: replies } = await supabase
    .from('replies')
    .select(`
      *,
      profile:profiles(*),
      reply_hearts!left(user_id)
    `)
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  const enrichedReplies = replies?.map(r => ({
    ...r,
    hearted: r.reply_hearts?.some((h: any) => h.user_id === user.id) ?? false,
    reply_hearts: undefined,
  })) ?? []

  return (
    <ThreadClient
      post={enrichedPost}
      initialReplies={enrichedReplies}
      currentUserId={user.id}
    />
  )
}
