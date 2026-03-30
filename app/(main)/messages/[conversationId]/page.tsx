import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ConversationClient from '@/components/messages/ConversationClient'

interface Props {
  params: { conversationId: string }
}

export default async function ConversationPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify user is part of this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      *,
      profile_one:profiles!conversations_participant_one_fkey(*),
      profile_two:profiles!conversations_participant_two_fkey(*)
    `)
    .eq('id', params.conversationId)
    .single()

  if (!conversation) notFound()
  const isParticipant =
    conversation.participant_one === user.id ||
    conversation.participant_two === user.id
  if (!isParticipant) redirect('/messages')

  const otherUser = conversation.participant_one === user.id
    ? conversation.profile_two
    : conversation.profile_one

  // Fetch messages
  const { data: messages } = await supabase
    .from('direct_messages')
    .select('*, sender:profiles!direct_messages_sender_id_fkey(*)')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark unread messages as read
  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', params.conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return (
    <ConversationClient
      conversation={conversation}
      otherUser={otherUser}
      initialMessages={messages ?? []}
      currentUserId={user.id}
    />
  )
}
