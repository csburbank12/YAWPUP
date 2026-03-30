export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_plus: boolean
  contribution_score: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  tags: string[]
  heart_count: number
  echo_count: number
  reply_count: number
  created_at: string
  profile?: Profile
  hearted?: boolean
  echoed?: boolean
}

export interface Circle {
  id: string
  name: string
  description: string | null
  color: string
  created_by: string
  is_paid: boolean
  price_cents: number
  member_count: number
  created_at: string
}

export interface CircleMessage {
  id: string
  circle_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export interface Reply {
  id: string
  post_id: string
  user_id: string
  content: string
  heart_count: number
  created_at: string
  profile?: Profile
  hearted?: boolean
}

export interface Conversation {
  id: string
  participant_one: string
  participant_two: string
  last_message_at: string
  created_at: string
  other_user?: Profile
  last_message?: DirectMessage
  unread_count?: number
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: Profile
}

export interface CircleMember {
  circle_id: string
  user_id: string
  role: 'member' | 'moderator' | 'owner'
  joined_at: string
}
