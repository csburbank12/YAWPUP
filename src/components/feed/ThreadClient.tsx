'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Post, Reply } from '@/types'
import PostCard from './PostCard'
import ReplyCard from './ReplyCard'

interface Props {
  post: Post
  initialReplies: Reply[]
  currentUserId: string
}

export default function ThreadClient({ post, initialReplies, currentUserId }: Props) {
  const [replies, setReplies] = useState<Reply[]>(initialReplies)
  const [localPost, setLocalPost] = useState<Post>(post)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Real-time replies
  useEffect(() => {
    const channel = supabase
      .channel(`thread-${post.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'replies', filter: `post_id=eq.${post.id}`
      }, async (payload) => {
        if (payload.new.user_id === currentUserId) return // already added optimistically
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', payload.new.user_id).single()
        setReplies(prev => [...prev, { ...payload.new as Reply, profile: profile ?? undefined, hearted: false }])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [post.id])

  const handleReply = async () => {
    if (!replyText.trim() || posting) return
    setPosting(true)
    const content = replyText.trim()
    setReplyText('')

    // Fetch own profile for optimistic insert
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', currentUserId).single()

    const { data, error } = await supabase
      .from('replies')
      .insert({ post_id: post.id, user_id: currentUserId, content })
      .select()
      .single()

    if (!error && data) {
      const newReply: Reply = { ...data, profile: profile ?? undefined, hearted: false }
      setReplies(prev => [...prev, newReply])
      setLocalPost(prev => ({ ...prev, reply_count: prev.reply_count + 1 }))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    setPosting(false)
  }

  const handleHeartPost = async (postId: string, hearted: boolean) => {
    setLocalPost(prev => ({
      ...prev, hearted: !hearted,
      heart_count: prev.heart_count + (hearted ? -1 : 1)
    }))
    if (hearted) {
      await supabase.from('hearts').delete().eq('post_id', postId).eq('user_id', currentUserId)
    } else {
      await supabase.from('hearts').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  const handleEchoPost = async (postId: string, echoed: boolean) => {
    setLocalPost(prev => ({
      ...prev, echoed: !echoed,
      echo_count: prev.echo_count + (echoed ? -1 : 1)
    }))
    if (echoed) {
      await supabase.from('echoes').delete().eq('post_id', postId).eq('user_id', currentUserId)
    } else {
      await supabase.from('echoes').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  const handleHeartReply = async (replyId: string, hearted: boolean) => {
    setReplies(prev => prev.map(r =>
      r.id === replyId
        ? { ...r, hearted: !hearted, heart_count: r.heart_count + (hearted ? -1 : 1) }
        : r
    ))
    if (hearted) {
      await supabase.from('reply_hearts').delete().eq('reply_id', replyId).eq('user_id', currentUserId)
    } else {
      await supabase.from('reply_hearts').insert({ reply_id: replyId, user_id: currentUserId })
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      {/* Back button */}
      <button onClick={() => router.back()} style={{
        background: 'none', border: 'none', color: '#888', cursor: 'pointer',
        fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center',
        gap: 6, padding: 0
      }}>
        ← Back
      </button>

      {/* Original post */}
      <PostCard
        post={localPost}
        currentUserId={currentUserId}
        onHeart={handleHeartPost}
        onEcho={handleEchoPost}
        showThread={false}
      />

      {/* Reply composer */}
      <div style={{
        background: '#141414',
        border: `1px solid ${focused ? '#3A3A3A' : '#2A2A2A'}`,
        borderRadius: 16, padding: '14px 18px', margin: '16px 0',
        transition: 'border-color 0.2s'
      }}>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && handleReply()}
          placeholder="Write a reply..."
          maxLength={280}
          rows={focused || replyText ? 3 : 1}
          style={{
            width: '100%', background: 'none', border: 'none', outline: 'none',
            color: '#F0F0F0', fontSize: 14, resize: 'none',
            fontFamily: 'Georgia, serif', lineHeight: 1.6
          }}
        />
        {(focused || replyText) && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 10, paddingTop: 10, borderTop: '1px solid #2A2A2A'
          }}>
            <span style={{
              color: 280 - replyText.length < 20 ? '#FF6B6B' : '#555',
              fontSize: 11, fontFamily: "'DM Mono', monospace"
            }}>
              {280 - replyText.length}
            </span>
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || posting}
              style={{
                background: replyText.trim() ? '#47FFB2' : '#2A2A2A',
                border: 'none', borderRadius: 20, padding: '7px 18px',
                color: replyText.trim() ? '#0D0D0D' : '#555',
                fontWeight: 700, fontSize: 13,
                cursor: replyText.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s'
              }}
            >
              {posting ? '...' : 'Reply'}
            </button>
          </div>
        )}
      </div>

      {/* Thread label */}
      {replies.length > 0 && (
        <div style={{
          color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.1em', marginBottom: 8, paddingLeft: 4
        }}>
          {replies.length} {replies.length === 1 ? 'REPLY' : 'REPLIES'}
        </div>
      )}

      {/* Replies */}
      <div style={{
        background: '#141414', border: '1px solid #2A2A2A',
        borderRadius: 16, padding: '0 20px', overflow: 'hidden'
      }}>
        {replies.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#555', padding: '32px 20px',
            fontFamily: 'Georgia, serif', fontSize: 14
          }}>
            No replies yet. Be the first.
          </div>
        ) : (
          replies.map((reply, i) => (
            <div key={reply.id} style={{
              borderBottom: i < replies.length - 1 ? '1px solid #1E1E1E' : 'none'
            }}>
              <ReplyCard
                reply={reply}
                currentUserId={currentUserId}
                onHeart={handleHeartReply}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
