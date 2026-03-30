'use client'
import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Circle, CircleMessage } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  circle: Circle
  currentUserId: string
  initialMessages: CircleMessage[]
}

export default function CircleChat({ circle, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<CircleMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`circle-${circle.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'circle_messages',
        filter: `circle_id=eq.${circle.id}`
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', payload.new.user_id).single()
        const newMsg = { ...payload.new as CircleMessage, profile: profile ?? undefined }
        setMessages(prev => [...prev, newMsg])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [circle.id])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')

    await supabase.from('circle_messages').insert({
      circle_id: circle.id,
      user_id: currentUserId,
      content,
    })
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: 16, padding: '16px 0'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '40px 20px' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 15 }}>
              No messages yet. Start the conversation.
            </p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.user_id === currentUserId
          const username = msg.profile?.username ?? 'unknown'
          return (
            <div key={msg.id} style={{
              display: 'flex', gap: 10,
              flexDirection: isMe ? 'row-reverse' : 'row'
            }}>
              {!isMe && <Avatar username={username} avatarUrl={msg.profile?.avatar_url} size={32} />}
              <div style={{ maxWidth: '75%' }}>
                {!isMe && (
                  <div style={{
                    color: '#888', fontSize: 11,
                    fontFamily: "'DM Mono', monospace", marginBottom: 4
                  }}>
                    @{username}
                  </div>
                )}
                <div style={{
                  background: isMe ? circle.color : '#1A1A1A',
                  color: isMe ? '#0D0D0D' : '#F0F0F0',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px', fontSize: 14,
                  fontFamily: 'Georgia, serif', lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
                <div style={{
                  color: '#555', fontSize: 10, marginTop: 4,
                  textAlign: isMe ? 'right' : 'left',
                  fontFamily: "'DM Mono', monospace"
                }}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, paddingTop: 16,
        borderTop: '1px solid #2A2A2A'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Say something..."
          maxLength={500}
          style={{
            flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: 20, padding: '10px 16px', color: '#F0F0F0',
            fontSize: 14, outline: 'none', fontFamily: 'Georgia, serif'
          }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending} style={{
          background: input.trim() ? circle.color : '#2A2A2A',
          border: 'none', borderRadius: 20, padding: '10px 18px',
          cursor: input.trim() ? 'pointer' : 'default',
          color: input.trim() ? '#0D0D0D' : '#555',
          fontWeight: 700, fontSize: 13, transition: 'all 0.15s', flexShrink: 0
        }}>
          Send
        </button>
      </div>
    </div>
  )
}
