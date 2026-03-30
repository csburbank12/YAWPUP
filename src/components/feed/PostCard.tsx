'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Post } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  post: Post
  currentUserId: string
  onHeart: (postId: string, hearted: boolean) => void
  onEcho: (postId: string, echoed: boolean) => void
  showThread?: boolean
}

export default function PostCard({ post, currentUserId, onHeart, onEcho, showThread = true }: Props) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
  const username = post.profile?.username ?? 'unknown'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#141414',
        border: `1px solid ${hovered ? '#3A3A3A' : '#2A2A2A'}`,
        borderRadius: 16, padding: '18px 20px', marginBottom: 12,
        transition: 'border-color 0.2s'
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar username={username} avatarUrl={post.profile?.avatar_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 14 }}>
              {post.profile?.display_name ?? username}
            </span>
            <span style={{ color: '#555', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              @{username}
            </span>
            <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>{timeAgo}</span>
          </div>

          <p
            onClick={() => showThread && router.push(`/post/${post.id}`)}
            style={{
              color: '#F0F0F0', fontSize: 15, lineHeight: 1.6,
              margin: '0 0 12px', fontFamily: 'Georgia, serif',
              wordBreak: 'break-word', cursor: showThread ? 'pointer' : 'default'
            }}
          >
            {post.content}
          </p>

          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  background: '#1E1E1E', color: '#E8FF47', fontSize: 11,
                  padding: '2px 8px', borderRadius: 20, fontFamily: "'DM Mono', monospace"
                }}>{tag}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 20 }}>
            <ActionBtn icon={post.hearted ? '♥' : '♡'} count={post.heart_count}
              active={post.hearted ?? false} activeColor="#FF6B6B"
              onClick={() => onHeart(post.id, post.hearted ?? false)} />
            <ActionBtn icon="⟳" count={post.echo_count}
              active={post.echoed ?? false} activeColor="#E8FF47"
              onClick={() => onEcho(post.id, post.echoed ?? false)} />
            <ActionBtn icon="◎" count={post.reply_count}
              active={false} activeColor="#47FFB2"
              onClick={() => showThread && router.push(`/post/${post.id}`)}
              label={post.reply_count === 1 ? 'reply' : 'replies'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, count, active, activeColor, onClick, label }: {
  icon: string; count: number; active: boolean
  activeColor: string; onClick: () => void; label?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', gap: 5,
        color: active ? activeColor : hovered ? '#888' : '#555',
        fontSize: 13, transition: 'color 0.15s'
      }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: "'DM Mono', monospace" }}>{count}</span>
      {label && count > 0 && <span style={{ fontSize: 11, color: '#555' }}>{label}</span>}
    </button>
  )
}
