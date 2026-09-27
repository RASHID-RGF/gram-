export interface UserBrief {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
}

export interface User extends UserBrief {
  email?: string | null;
  bio?: string | null;
  website?: string | null;
  gender?: string | null;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at?: string;
  is_self: boolean;
  is_following: boolean;
  is_followed_by: boolean;
  is_follow_requested: boolean;
  is_blocked: boolean;
}

export interface Media {
  id: string;
  url: string;
  media_type: string;
  position: number;
}

export interface Post {
  id: string;
  caption: string;
  location?: string | null;
  media_type: string;
  media: Media[];
  user: UserBrief;
  like_count: number;
  comment_count: number;
  save_count: number;
  liked: boolean;
  saved: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  text: string;
  user: UserBrief;
  like_count: number;
  liked: boolean;
  reply_count: number;
  created_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface Story {
  id: string;
  media_url: string;
  media_type: string;
  caption?: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  seen: boolean;
}

export interface StoryGroup {
  user: UserBrief;
  stories: Story[];
  all_seen: boolean;
  is_own: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  actor: UserBrief;
  post_id?: string | null;
  comment_id?: string | null;
  story_id?: string | null;
  text?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: UserBrief;
  text?: string | null;
  media_url?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: UserBrief[];
  last_message?: Message | null;
  unread_count: number;
  updated_at: string;
}

export interface Hashtag {
  id: string;
  name: string;
  post_count: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SearchResults {
  users?: User[];
  hashtags?: Hashtag[];
  posts?: Post[];
}
