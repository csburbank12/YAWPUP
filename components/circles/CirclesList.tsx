'use client'
import { useState } from 'react'
import { Circle } from '@/types'
import CircleChat from './CircleChat'
import { createClient } from '@/lib/supabase/client'

interface Props {
  circles: Circle[]
  currentUserId: string
}

export default function CirclesList({ circles, currentUserId }: Props) {
  const [selected, setSelected] = useState<Circle | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [allCircles, setAllCircles] = useState<Circle[]>(circles)

  const openCircle = async (circle: Circle) => {
    setLoading(true)
    setSelected(circle)
    const supabase = createClient()

    // Join if not already a member
    await supabase.from('circle_members').upsert({
      circle_id: circle.id, user_id: currentUserId, role: 'member'
    }, { onConflict: 'circle_id,user_id' })

    const { data } = await supabase
      .from('circle_messages')
      .select('*, profile:profiles(*)')
      .eq('circle_id', circle.id)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages(data ?? [])
    setLoading(false)
  }

  const createCircle = async () => {
    if (!newName.trim()) return
    const supabase = createClient()
    const colors = ['#E8FF47', '#47FFB2', '#7C4DFF', '#FF6B6B', '#00BCD4', '#FF9800']
    const color = colors[Math.floor(Math.random() * colors.length)]

    const { data } = await supabase.from('circles').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      color,
      created_by: currentUserId,
    }).select().single()

    if (data) {
      await supabase.from('circle_members').insert({
        circle_id: data.id, user_id: currentUserId, role: 'owner'
      })
      setAllCircles(prev => [data, ...prev])
      setCreating(false)
      setNewName('')
      setNewDesc('')
      openCircle(data)
    }
  }

  if (selected) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <button onClick={() => setSelected(null)} style={{
          background: 'none', border: 'none', color: '#888',
          cursor: 'pointer', fontSize: 14, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 6, padding: 0
        }}>
          ← Back to Circles
        </button>

        <div style={{
          background: '#141414', border: '1px solid #2A2A2A',
          borderRadius: 16, padding: '16px 20px', marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: selected.color }} />
            <span style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 16 }}>{selected.name}</span>
            <span style={{
              color: '#555', fontSize: 11, marginLeft: 'auto',
              fontFamily: "'DM Mono', monospace"
            }}>
              {selected.member_count} members
            </span>
          </div>
          {selected.description && (
            <p style={{ color: '#888', fontSize: 13, fontFamily: 'Georgia, serif', margin: 0 }}>
              {selected.description}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Loading...</div>
        ) : (
          <CircleChat circle={selected} currentUserId={currentUserId} initialMessages={messages} />
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#F0F0F0', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Circles</h2>
        <p style={{ color: '#888', fontSize: 14, fontFamily: 'Georgia, serif' }}>
          Intimate communities around what you care about.
        </p>
      </div>

      {allCircles.map(circle => (
        <div key={circle.id} onClick={() => openCircle(circle)}
          style={{
            background: '#141414', border: '1px solid #2A2A2A',
            borderRadius: 14, padding: '16px 18px', marginBottom: 10,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = circle.color)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: circle.color + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: circle.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#F0F0F0', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
              {circle.name}
            </div>
            {circle.description && (
              <div style={{
                color: '#888', fontSize: 12,
                fontFamily: 'Georgia, serif',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {circle.description}
              </div>
            )}
            <div style={{ color: '#555', fontSize: 11, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>
              {circle.member_count} members
            </div>
          </div>
          <span style={{ color: '#555', fontSize: 18 }}>›</span>
        </div>
      ))}

      {/* Create circle */}
      {creating ? (
        <div style={{
          background: '#141414', border: '1px solid #3A3A3A',
          borderRadius: 14, padding: '16px 18px', marginTop: 4
        }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Circle name"
            style={{
              width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: 8, padding: '10px 14px', color: '#F0F0F0',
              fontSize: 14, outline: 'none', marginBottom: 10
            }}
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            style={{
              width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: 8, padding: '10px 14px', color: '#F0F0F0',
              fontSize: 14, outline: 'none', marginBottom: 14
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCreating(false)} style={{
              flex: 1, background: 'none', border: '1px solid #2A2A2A',
              borderRadius: 20, padding: '9px', color: '#888', cursor: 'pointer', fontSize: 13
            }}>Cancel</button>
            <button onClick={createCircle} style={{
              flex: 1, background: '#E8FF47', border: 'none',
              borderRadius: 20, padding: '9px', color: '#0D0D0D',
              fontWeight: 700, cursor: 'pointer', fontSize: 13
            }}>Create</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} style={{
          width: '100%', background: 'none', border: '1px dashed #2A2A2A',
          borderRadius: 14, padding: 14, color: '#555', cursor: 'pointer',
          fontSize: 13, marginTop: 4, transition: 'border-color 0.2s, color 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8FF47'; e.currentTarget.style.color = '#E8FF47' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#555' }}
        >
          + Create a Circle
        </button>
      )}
    </div>
  )
}
