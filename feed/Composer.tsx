'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'

interface Props {
  currentUserId: string
  onPost: (post: Post) => void
}

export default function Composer({ currentUserId, onPost }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const remaining = 280 - content.length
  const canPost = content.trim().length > 0 && !loading

  const handlePost = async () => {
    if (!canPost) return
    setLoading(true)
    const supabase = createClient()

    const tags = [...new Set(content.match(/#\w+/g)?.map(t => t.toLowerCase()) ?? [])]

    const { data, error } = await supabase
      .from('posts')
      .insert({ content: content.trim(), tags, user_id: currentUserId })
      .select('*, profile:profiles(*)')
      .single()

    if (!error && data) {
      onPost({ ...data, hearted: false, echoed: false })
      setContent('')
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${focused ? '#3A3A3A' : '#2A2A2A'}`,
      borderRadius: 16, padding: '16px 20px', marginBottom: 20,
      transition: 'border-color 0.2s'
    }}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKey}
        placeholder="What's your yawp today?"
        maxLength={280}
        rows={focused || content ? 3 : 1}
        style={{
          width: '100%', background: 'none', border: 'none', outline: 'none',
          color: '#F0F0F0', fontSize: 15, resize: 'none',
          fontFamily: 'Georgia, serif', lineHeight: 1.6,
          transition: 'height 0.2s'
        }}
      />
      {(focused || content) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 12,
          borderTop: '1px solid #2A2A2A', paddingTop: 12
        }}>
          <span style={{
            color: remaining < 40 ? (remaining < 20 ? '#FF6B6B' : '#FF8C47') : '#555',
            fontSize: 12, fontFamily: "'DM Mono', monospace"
          }}>
            {remaining}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#555', fontSize: 11 }}>⌘↵ to post</span>
            <button onClick={handlePost} disabled={!canPost} style={{
              background: canPost ? '#E8FF47' : '#2A2A2A',
              border: 'none', borderRadius: 20, padding: '7px 18px',
              color: canPost ? '#0D0D0D' : '#555',
              fontWeight: 700, fontSize: 13,
              cursor: canPost ? 'pointer' : 'default',
              transition: 'all 0.15s'
            }}>
              {loading ? '...' : 'Yawp'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
