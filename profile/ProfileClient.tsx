'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Post } from '@/types'
import Avatar from '@/components/ui/Avatar'
import PostCard from '@/components/feed/PostCard'

interface Props {
  profile: Profile | null
  posts: Post[]
  postCount: number
  followingCount: number
}

export default function ProfileClient({ profile, posts, postCount, followingCount }: Props) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [localPosts, setLocalPosts] = useState<Post[]>(posts)

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      display_name: displayName.trim() || profile.username,
      bio: bio.trim() || null,
    }).eq('id', profile.id)
    setSaving(false)
    setEditing(false)
  }

  const handleHeart = async (postId: string, hearted: boolean) => {
    setLocalPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, hearted: !hearted, heart_count: p.heart_count + (hearted ? -1 : 1) }
        : p
    ))
    const supabase = createClient()
    if (hearted) {
      await supabase.from('hearts').delete().eq('post_id', postId).eq('user_id', profile!.id)
    } else {
      await supabase.from('hearts').insert({ post_id: postId, user_id: profile!.id })
    }
  }

  const handleEcho = async (postId: string, echoed: boolean) => {
    setLocalPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, echoed: !echoed, echo_count: p.echo_count + (echoed ? -1 : 1) }
        : p
    ))
    const supabase = createClient()
    if (echoed) {
      await supabase.from('echoes').delete().eq('post_id', postId).eq('user_id', profile!.id)
    } else {
      await supabase.from('echoes').insert({ post_id: postId, user_id: profile!.id })
    }
  }

  if (!profile) return null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      {/* Profile card */}
      <div style={{
        background: '#141414', border: '1px solid #2A2A2A',
        borderRadius: 16, padding: 24, marginBottom: 20
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={56} />
          <div style={{ flex: 1 }}>
            {editing ? (
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                style={{
                  background: '#1A1A1A', border: '1px solid #3A3A3A',
                  borderRadius: 8, padding: '6px 10px', color: '#F0F0F0',
                  fontSize: 18, fontWeight: 700, outline: 'none', width: '100%', marginBottom: 4
                }}
              />
            ) : (
              <div style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 18, marginBottom: 2 }}>
                {profile.display_name ?? profile.username}
              </div>
            )}
            <div style={{ color: '#555', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
              @{profile.username}
            </div>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              background: 'none', border: '1px solid #2A2A2A', borderRadius: 16,
              color: '#888', fontSize: 12, padding: '5px 14px', cursor: 'pointer'
            }}>Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(false)} style={{
                background: 'none', border: '1px solid #2A2A2A', borderRadius: 16,
                color: '#888', fontSize: 12, padding: '5px 12px', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                background: '#E8FF47', border: 'none', borderRadius: 16,
                color: '#0D0D0D', fontSize: 12, fontWeight: 700,
                padding: '5px 12px', cursor: 'pointer'
              }}>{saving ? '...' : 'Save'}</button>
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Write a short bio..."
            maxLength={160}
            rows={3}
            style={{
              width: '100%', background: '#1A1A1A', border: '1px solid #3A3A3A',
              borderRadius: 8, padding: '8px 10px', color: '#F0F0F0',
              fontSize: 14, outline: 'none', resize: 'none',
              fontFamily: 'Georgia, serif', lineHeight: 1.5, marginBottom: 16
            }}
          />
        ) : profile.bio ? (
          <p style={{
            color: '#888', fontSize: 14, fontFamily: 'Georgia, serif',
            lineHeight: 1.6, marginBottom: 16
          }}>
            {profile.bio}
          </p>
        ) : null}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, marginBottom: 16 }}>
          {[
            { label: 'Yawps', value: postCount },
            { label: 'Following', value: followingCount },
            { label: 'Followers', value: '—' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{
                color: '#F0F0F0', fontWeight: 700, fontSize: 20,
                fontFamily: "'DM Mono', monospace"
              }}>{stat.value}</div>
              <div style={{ color: '#555', fontSize: 11 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div style={{
          background: '#E8FF4711', border: '1px solid #E8FF4733',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10
        }}>
          <span style={{ color: '#E8FF47', fontSize: 15, flexShrink: 0 }}>◎</span>
          <div>
            <div style={{ color: '#E8FF47', fontSize: 12, fontWeight: 600 }}>
              Follower counts are private on Yawp
            </div>
            <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
              Your voice matters, not your number.
            </div>
          </div>
        </div>
      </div>

      {/* Yawp+ */}
      {!profile.is_plus && (
        <div style={{
          background: '#141414', border: '1px solid #2A2A2A',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24
        }}>
          <div style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
            Yawp+
          </div>
          <p style={{
            color: '#888', fontSize: 13, fontFamily: 'Georgia, serif',
            lineHeight: 1.6, marginBottom: 14
          }}>
            Support an ad-free internet. Get expanded storage, custom themes,
            and early access to new features for $5/mo.
          </p>
          <button style={{
            background: '#E8FF47', border: 'none', borderRadius: 20,
            padding: '9px 20px', color: '#0D0D0D',
            fontWeight: 700, fontSize: 13, cursor: 'pointer'
          }}>
            Join Yawp+ — $5/mo
          </button>
        </div>
      )}

      {/* Posts */}
      <h3 style={{
        color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.1em', marginBottom: 16
      }}>YOUR YAWPS</h3>

      {localPosts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', padding: '40px 20px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15 }}>
            You haven't yawped yet. Go say something.
          </p>
        </div>
      ) : (
        localPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={profile.id}
            onHeart={handleHeart}
            onEcho={handleEcho}
          />
        ))
      )}
    </div>
  )
}
