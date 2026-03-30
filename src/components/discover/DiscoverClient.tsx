'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import Avatar from '@/components/ui/Avatar'

const TAG_COLORS = ['#E8FF47','#47FFB2','#7C4DFF','#FF6B6B','#00BCD4','#FF9800','#FF4081','#69F0AE']

interface Props {
  trending: { tag: string; count: number }[]
  suggested: Profile[]
  currentUserId: string
}

export default function DiscoverClient({ trending, suggested, currentUserId }: Props) {
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  const handleFollow = async (userId: string) => {
    const supabase = createClient()
    if (followed.has(userId)) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId).eq('following_id', userId)
      setFollowed(prev => { const s = new Set(prev); s.delete(userId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId })
      setFollowed(prev => new Set([...prev, userId]))
    }
  }

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q}%`)
      .neq('id', currentUserId)
      .limit(8)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  const displayProfiles = search.length >= 2 ? searchResults : suggested

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      {/* Search */}
      <div style={{ marginBottom: 28 }}>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search people..."
          style={{
            width: '100%', background: '#141414', border: '1px solid #2A2A2A',
            borderRadius: 20, padding: '11px 18px', color: '#F0F0F0',
            fontSize: 14, outline: 'none'
          }}
        />
      </div>

      {/* Trending tags */}
      {!search && trending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.1em', marginBottom: 12
          }}>TRENDING TODAY</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trending.map(({ tag, count }, i) => (
              <div key={tag} style={{
                background: '#141414', border: '1px solid #2A2A2A',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: TAG_COLORS[i % TAG_COLORS.length], flexShrink: 0
                }} />
                <span style={{
                  color: TAG_COLORS[i % TAG_COLORS.length],
                  fontWeight: 700, fontSize: 14, fontFamily: "'DM Mono', monospace", flex: 1
                }}>
                  {tag}
                </span>
                <span style={{ color: '#555', fontSize: 12 }}>{count} yawps</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People */}
      <div>
        <h3 style={{
          color: '#555', fontSize: 11, fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.1em', marginBottom: 12
        }}>
          {search.length >= 2 ? 'SEARCH RESULTS' : 'PEOPLE YOU MIGHT LIKE'}
        </h3>

        {searching && (
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 20 }}>Searching...</p>
        )}

        {!searching && displayProfiles.length === 0 && (
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 20 }}>
            {search.length >= 2 ? 'No users found.' : 'No suggestions yet.'}
          </p>
        )}

        {displayProfiles.map(profile => (
          <div key={profile.id} style={{
            background: '#141414', border: '1px solid #2A2A2A',
            borderRadius: 12, padding: '14px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#F0F0F0', fontWeight: 600, fontSize: 14 }}>
                {profile.display_name ?? profile.username}
              </div>
              <div style={{ color: '#555', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                @{profile.username}
              </div>
              {profile.bio && (
                <div style={{
                  color: '#888', fontSize: 12, marginTop: 2,
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {profile.bio}
                </div>
              )}
            </div>
            <button onClick={() => handleFollow(profile.id)} style={{
              background: followed.has(profile.id) ? '#1A1A1A' : 'none',
              border: `1px solid ${followed.has(profile.id) ? '#3A3A3A' : '#2A2A2A'}`,
              borderRadius: 20, color: followed.has(profile.id) ? '#888' : '#F0F0F0',
              padding: '6px 14px', cursor: 'pointer', fontSize: 12,
              flexShrink: 0, transition: 'all 0.15s'
            }}>
              {followed.has(profile.id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
