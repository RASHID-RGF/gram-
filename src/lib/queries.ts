"use client";

import {
  QueryClient,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { api, queryString } from "./api";
import type {
  Comment,
  Conversation,
  CursorPage,
  Hashtag,
  Message,
  NotificationItem,
  Page,
  Post,
  StoryGroup,
  User,
} from "./types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export function useFeed(enabled = true) {
  return useInfiniteQuery({
    queryKey: ["feed"],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api<CursorPage<Post>>(`/feed${queryString({ limit: 10, before: pageParam })}`),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
}

export function useExplore(enabled = true) {
  return useInfiniteQuery({
    queryKey: ["explore"],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api<CursorPage<Post>>(`/feed/explore${queryString({ limit: 18, before: pageParam })}`),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
}

export function useProfile(username?: string, enabled = true) {
  return useQuery({
    queryKey: ["profile", username],
    enabled: Boolean(username) && enabled,
    queryFn: () => api<User>(`/users/${username}`),
  });
}

export function useUserPosts(username?: string, enabled = true) {
  return useQuery({
    queryKey: ["user-posts", username],
    enabled: Boolean(username) && enabled,
    queryFn: () => api<Page<Post>>(`/users/${username}/posts${queryString({ limit: 12 })}`),
  });
}

export function usePost(postId?: string, enabled = true) {
  return useQuery({
    queryKey: ["post", postId],
    enabled: Boolean(postId) && enabled,
    queryFn: () => api<Post>(`/posts/${postId}`),
  });
}

export function useComments(postId?: string, enabled = true) {
  return useQuery({
    queryKey: ["comments", postId],
    enabled: Boolean(postId) && enabled,
    queryFn: () => api<Page<Comment>>(`/posts/${postId}/comments${queryString({ limit: 50 })}`),
  });
}

export function useStories(enabled = true) {
  return useQuery({
    queryKey: ["stories"],
    enabled,
    queryFn: () => api<StoryGroup[]>("/stories/feed"),
  });
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    enabled,
    queryFn: () => api<Page<NotificationItem>>(`/notifications${queryString({ limit: 30 })}`),
  });
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread"],
    enabled,
    refetchInterval: 30_000,
    queryFn: () => api<{ unread: number }>("/notifications/unread-count"),
  });
}

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: ["conversations"],
    enabled,
    queryFn: () => api<Conversation[]>("/conversations"),
  });
}

export function useMessages(conversationId?: string, enabled = true) {
  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: Boolean(conversationId) && enabled,
    queryFn: () =>
      api<Page<Message>>(
        `/conversations/${conversationId}/messages${queryString({ limit: 50 })}`,
      ),
  });
}

export function useSaved(enabled = true) {
  return useQuery({
    queryKey: ["saved"],
    enabled,
    queryFn: () => api<Page<Post>>(`/users/me/saved${queryString({ limit: 12 })}`),
  });
}

export function useFollowers(username?: string, enabled = true) {
  return useQuery({
    queryKey: ["followers", username],
    enabled: Boolean(username) && enabled,
    queryFn: () => api<Page<User>>(`/users/${username}/followers${queryString({ limit: 30 })}`),
  });
}

export function useFollowing(username?: string, enabled = true) {
  return useQuery({
    queryKey: ["following", username],
    enabled: Boolean(username) && enabled,
    queryFn: () => api<Page<User>>(`/users/${username}/following${queryString({ limit: 30 })}`),
  });
}

export function useSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search", query],
    enabled: enabled && query.trim().length > 0,
    queryFn: () =>
      api<{ users?: User[]; hashtags?: Hashtag[]; posts?: Post[] }>(
        `/search${queryString({ q: query, limit: 8 })}`,
      ),
  });
}

export function useHashtag(name?: string, enabled = true) {
  return useQuery({
    queryKey: ["hashtag", name],
    enabled: Boolean(name) && enabled,
    queryFn: () => api<Page<Post>>(`/hashtags/${name}/posts${queryString({ limit: 18 })}`),
  });
}

export function useTrendingHashtags(enabled = true) {
  return useQuery({
    queryKey: ["hashtags", "trending"],
    enabled,
    queryFn: () => api<Hashtag[]>("/hashtags?limit=12"),
  });
}

export function useSuggestions(enabled = true) {
  return useQuery({
    queryKey: ["suggestions"],
    enabled,
    queryFn: () => api<User[]>("/feed/suggestions?limit=6"),
  });
}
