'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Reply } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  reply: Reply
  currentUserId: string
  onHeart: (replyId: string, hearted: boolean) => void
}

export default function ReplyCard({ reply, currentUserId, onHeart }: Props) {
  const username = reply.profile?.username ?? 'unknown'
  const timeAgo = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 0',
      borderBottom: '1px solid #1E1E1E'
    }}>
      {/* Thread line + avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <Avatar username={username} avatarUrl={reply.profile?.avatar_url} size={32} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ color: '#F0F0F0', fontWeight: 600, fontSize: 13 }}>
            {reply.profile?.display_name ?? username}
          </span>
          <span style={{ color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
            @{username}
          </span>
          <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>{timeAgo}</span>
        </div>

        <p style={{
          color: '#E0E0E0', fontSize: 14, lineHeight: 1.6,
          margin: '0 0 10px', fontFamily: 'Georgia, serif', wordBreak: 'break-word'
        }}>
          {reply.content}
        </p>

        <button
          onClick={() => onHeart(reply.id, reply.hearted ?? false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            color: reply.hearted ? '#FF6B6B' : '#555', fontSize: 12,
            transition: 'color 0.15s'
          }}
        >
          <span style={{ fontSize: 14 }}>{reply.hearted ? '♥' : '♡'}</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>{reply.heart_count}</span>
        </button>
      </div>
    </div>
  )
}
