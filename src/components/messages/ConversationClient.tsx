'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { DirectMessage, Profile } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  conversation: { id: string }
  otherUser: Profile
  initialMessages: DirectMessage[]
  currentUserId: string
}

function MessageBubble({ msg, isMe }: { msg: DirectMessage; isMe: boolean }) {
  const time = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })
  return (
    <div style={{
      display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 8, marginBottom: 4
    }}>
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          background: isMe ? '#E8FF47' : '#1E1E1E',
          color: isMe ? '#0D0D0D' : '#F0F0F0',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px', fontSize: 14,
          fontFamily: 'Georgia, serif', lineHeight: 1.55,
          wordBreak: 'break-word'
        }}>
          {msg.content}
        </div>
        <div style={{
          color: '#555', fontSize: 10, marginTop: 3,
          textAlign: isMe ? 'right' : 'left',
          fontFamily: "'DM Mono', monospace"
        }}>
          {time}
          {isMe && msg.read_at && (
            <span style={{ marginLeft: 6, color: '#47FFB2' }}>✓ read</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DateDivider({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d, yyyy')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      margin: '16px 0', color: '#555', fontSize: 11,
      fontFamily: "'DM Mono', monospace"
    }}>
      <div style={{ flex: 1, height: 1, background: '#2A2A2A' }} />
      <span>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#2A2A2A' }} />
    </div>
  )
}

export default function ConversationClient({ conversation, otherUser, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`dm-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, async (payload) => {
        if (payload.new.sender_id === currentUserId) return
        const { data: sender } = await supabase
          .from('profiles').select('*').eq('id', payload.new.sender_id).single()

        setMessages(prev => [...prev, {
          ...payload.new as DirectMessage,
          sender: sender ?? undefined
        }])

        // Mark as read
        await supabase.from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', payload.new.id)

        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation.id])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')

    const optimistic: DirectMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content, read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { data } = await supabase
      .from('direct_messages')
      .insert({ conversation_id: conversation.id, sender_id: currentUserId, content })
      .select()
      .single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...data } : m))
    }
    setSending(false)
  }

  // Group messages by date for dividers
  const grouped: { date: string; messages: DirectMessage[] }[] = []
  messages.forEach(msg => {
    const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd')
    const last = grouped[grouped.length - 1]
    if (last?.date === dateKey) {
      last.messages.push(msg)
    } else {
      grouped.push({ date: dateKey, messages: [msg] })
    }
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 130px)', maxWidth: 640,
      margin: '0 auto', padding: '0 16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 0', borderBottom: '1px solid #2A2A2A',
        flexShrink: 0
      }}>
        <button onClick={() => router.push('/messages')} style={{
          background: 'none', border: 'none', color: '#888',
          cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1
        }}>←</button>
        <Avatar username={otherUser.username} avatarUrl={otherUser.avatar_url} size={36} />
        <div>
          <div style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 14 }}>
            {otherUser.display_name ?? otherUser.username}
          </div>
          <div style={{ color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
            @{otherUser.username}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 14 }}>
              Start the conversation.
            </p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            <DateDivider date={new Date(group.date)} />
            {group.messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={msg.sender_id === currentUserId}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 0',
        borderTop: '1px solid #2A2A2A', flexShrink: 0
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={`Message @${otherUser.username}...`}
          maxLength={1000}
          rows={1}
          style={{
            flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: 20, padding: '10px 16px', color: '#F0F0F0',
            fontSize: 14, outline: 'none', resize: 'none',
            fontFamily: 'Georgia, serif', lineHeight: 1.5,
            maxHeight: 120, overflowY: 'auto'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            background: input.trim() ? '#E8FF47' : '#2A2A2A',
            border: 'none', borderRadius: 20, padding: '10px 18px',
            color: input.trim() ? '#0D0D0D' : '#555',
            fontWeight: 700, fontSize: 13, cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s', flexShrink: 0, alignSelf: 'flex-end'
          }}
        >
          {sending ? '...' : '↑'}
        </button>
      </div>
    </div>
  )
}
