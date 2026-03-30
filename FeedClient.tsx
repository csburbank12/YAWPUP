'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import PostCard from './PostCard'
import Composer from './Composer'

interface Props {
  initialPosts: Post[]
  currentUserId: string
}

export default function FeedClient({ initialPosts, currentUserId }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev])
  }

  const handleHeart = async (postId: string, hearted: boolean) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, hearted: !hearted, heart_count: p.heart_count + (hearted ? -1 : 1) }
        : p
    ))
    const supabase = createClient()
    if (hearted) {
      await supabase.from('hearts').delete().eq('post_id', postId).eq('user_id', currentUserId)
    } else {
      await supabase.from('hearts').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  const handleEcho = async (postId: string, echoed: boolean) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, echoed: !echoed, echo_count: p.echo_count + (echoed ? -1 : 1) }
        : p
    ))
    const supabase = createClient()
    if (echoed) {
      await supabase.from('echoes').delete().eq('post_id', postId).eq('user_id', currentUserId)
    } else {
      await supabase.from('echoes').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <Composer currentUserId={currentUserId} onPost={handleNewPost} />

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
          <p style={{ fontSize: 28, marginBottom: 12 }}>⬡</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 8 }}>
            The feed is quiet.
          </p>
          <p style={{ fontSize: 13 }}>Be the first to yawp.</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onHeart={handleHeart}
            onEcho={handleEcho}
          />
        ))
      )}
    </div>
  )
}
