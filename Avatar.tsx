const COLORS = ['#7C4DFF','#00BCD4','#FF6B6B','#FF9800','#47FFB2','#E8FF47','#FF4081']

function colorFromString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface Props {
  username: string
  size?: number
  avatarUrl?: string | null
}

export default function Avatar({ username, size = 38, avatarUrl }: Props) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={username} style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0
      }} />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colorFromString(username),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      fontFamily: "'DM Mono', monospace", flexShrink: 0, userSelect: 'none'
    }}>
      {username[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
