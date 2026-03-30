import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InboxClient from '@/components/messages/InboxClient'

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all conversations with other user's profile and last message
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      profile_one:profiles!conversations_participant_one_fkey(*),
      profile_two:profiles!conversations_participant_two_fkey(*)
    `)
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  // Enrich with last message and unread count
  const enriched = await Promise.all((conversations ?? []).map(async (conv) => {
    const otherUser = conv.participant_one === user.id
      ? conv.profile_two
      : conv.profile_one

    const { data: lastMsg } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { count: unread } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)
      .is('read_at', null)

    return {
      ...conv,
      other_user: otherUser,
      last_message: lastMsg ?? undefined,
      unread_count: unread ?? 0,
    }
  }))

  // Fetch users to start new conversations with
  const { data: following } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(*)')
    .eq('follower_id', user.id)

  return (
    <InboxClient
      conversations={enriched}
      currentUserId={user.id}
      following={following?.map((f: any) => f.profiles) ?? []}
    />
  )
}
