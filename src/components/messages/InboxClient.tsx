'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Conversation, Profile } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  conversations: Conversation[]
  currentUserId: string
  following: Profile[]
}

export default function InboxClient({ conversations, currentUserId, following }: Props) {
  const router = useRouter()
  const [composing, setComposing] = useState(false)
  const [search, setSearch] = useState('')
  const [starting, setStarting] = useState(false)

  const filtered = following.filter(p =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.display_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const startConversation = async (otherUserId: string) => {
    setStarting(true)
    const supabase = createClient()

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_one.eq.${currentUserId},participant_two.eq.${otherUserId}),` +
        `and(participant_one.eq.${otherUserId},participant_two.eq.${currentUserId})`
      )
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
      return
    }

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ participant_one: currentUserId, participant_two: otherUserId })
      .select('id')
      .single()

    if (newConv) router.push(`/messages/${newConv.id}`)
    setStarting(false)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#F0F0F0', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Messages</h2>
          <p style={{ color: '#888', fontSize: 13, fontFamily: 'Georgia, serif' }}>
            Private. End-to-end just between you.
          </p>
        </div>
        <button onClick={() => setComposing(!composing)} style={{
          background: composing ? '#2A2A2A' : '#E8FF47',
          border: 'none', borderRadius: 20, padding: '8px 16px',
          color: composing ? '#888' : '#0D0D0D',
          fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
        }}>
          {composing ? 'Cancel' : '+ New'}
        </button>
      </div>

      {/* New message composer */}
      {composing && (
        <div style={{
          background: '#141414', border: '1px solid #3A3A3A',
          borderRadius: 14, padding: 16, marginBottom: 16
        }}>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
            MESSAGE SOMEONE YOU FOLLOW
          </p>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username..."
            style={{
              width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: 10, padding: '10px 14px', color: '#F0F0F0',
              fontSize: 14, outline: 'none', marginBottom: 10
            }}
          />
          {search && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.length === 0 ? (
                <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 12 }}>
                  No one found. You can only message people you follow.
                </p>
              ) : (
                filtered.slice(0, 6).map(profile => (
                  <button key={profile.id} onClick={() => startConversation(profile.id)}
                    disabled={starting}
                    style={{
                      background: 'none', border: '1px solid #2A2A2A', borderRadius: 10,
                      padding: '10px 14px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: 10, transition: 'border-color 0.15s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#E8FF47'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}
                  >
                    <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={32} />
                    <div>
                      <div style={{ color: '#F0F0F0', fontSize: 13, fontWeight: 600 }}>
                        {profile.display_name ?? profile.username}
                      </div>
                      <div style={{ color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                        @{profile.username}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', padding: '60px 20px' }}>
          <p style={{ fontSize: 28, marginBottom: 12 }}>✉</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, marginBottom: 6 }}>No messages yet.</p>
          <p style={{ fontSize: 13 }}>Follow someone and start a conversation.</p>
        </div>
      ) : (
        conversations.map(conv => {
          const other = conv.other_user
          if (!other) return null
          const isUnread = (conv.unread_count ?? 0) > 0
          const lastMsg = conv.last_message

          return (
            <div key={conv.id}
              onClick={() => router.push(`/messages/${conv.id}`)}
              style={{
                background: '#141414',
                border: `1px solid ${isUnread ? '#3A3A3A' : '#2A2A2A'}`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3A3A3A'}
              onMouseLeave={e => e.currentTarget.style.borderColor = isUnread ? '#3A3A3A' : '#2A2A2A'}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar username={other.username} avatarUrl={other.avatar_url} size={44} />
                {isUnread && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#E8FF47', border: '2px solid #141414'
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{
                    color: '#F0F0F0', fontWeight: isUnread ? 700 : 600, fontSize: 14
                  }}>
                    {other.display_name ?? other.username}
                  </span>
                  {lastMsg && (
                    <span style={{ color: '#555', fontSize: 11 }}>
                      {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div style={{
                  color: isUnread ? '#888' : '#555', fontSize: 13,
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {lastMsg
                    ? `${lastMsg.sender_id === currentUserId ? 'You: ' : ''}${lastMsg.content}`
                    : 'No messages yet'}
                </div>
              </div>
              {isUnread && (
                <div style={{
                  background: '#E8FF47', color: '#0D0D0D',
                  borderRadius: 20, padding: '2px 8px',
                  fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace",
                  flexShrink: 0
                }}>
                  {conv.unread_count}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
