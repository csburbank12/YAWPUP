import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DiscoverClient from '@/components/discover/DiscoverClient'

export default async function DiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get trending tags from recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('tags')
    .gte('created_at', new Date(Date.now() - 86400000).toISOString())
    .limit(200)

  // Count tag frequency
  const tagCounts: Record<string, number> = {}
  recentPosts?.forEach(post => {
    post.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    })
  })
  const trending = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))

  // Get suggested profiles (not yet followed)
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = following?.map(f => f.following_id) ?? []

  const { data: suggested } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .not('id', 'in', followingIds.length > 0 ? `(${followingIds.join(',')})` : '(null)')
    .order('contribution_score', { ascending: false })
    .limit(10)

  return (
    <DiscoverClient
      trending={trending}
      suggested={suggested ?? []}
      currentUserId={user.id}
    />
  )
}
