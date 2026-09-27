"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useFeed, useSuggestions, useUnreadNotifications } from "@/lib/queries";
import { formatCount } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { LoadingBlock } from "@/components/Feedback";
import { PostCard } from "@/components/PostCard";
import { StoriesBar } from "@/components/StoriesBar";

export default function FeedPage() {
  const { user } = useAuth();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(Boolean(user));
  const { data: suggestions } = useSuggestions(Boolean(user));
  const { data: unread } = useUnreadNotifications(Boolean(user));

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-0 py-0 md:py-6">
      <div className="min-w-0 flex-1 md:max-w-[600px]">
        <div className="px-0 pt-0 md:px-0">
          <StoriesBar />
        </div>

        {isLoading && <LoadingBlock label="Loading posts…" />}

        {!isLoading && posts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">Welcome to Gram</h2>
            <p className="mt-2 text-sm text-muted">
              Follow people to see their posts here. Try the suggestions on the right.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Explore
            </Link>
          </div>
        )}

        <div className="space-y-0 md:space-y-0">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {hasNextPage && (
          <div className="py-6 text-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-md border bg-white px-5 py-2 text-sm font-semibold hover:bg-subtle disabled:opacity-60"
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>

      <aside className="hidden w-[320px] shrink-0 pt-10 lg:block">
        <div className="flex items-center gap-3">
          <Avatar user={user} size={52} linkTo={`/u/${user?.username}`} />
          <div className="min-w-0 flex-1">
            <Link href={`/u/${user?.username}`} className="block truncate text-sm font-semibold">
              {user?.username}
            </Link>
            <p className="truncate text-sm text-muted">{user?.full_name || " "}</p>
          </div>
          <Link href="/notifications" className="text-xs font-semibold text-brand">
            {unread?.unread ? `${formatCount(unread.unread)} new` : "Switch"}
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted">Suggested for you</p>
          <Link href="/explore" className="text-xs font-semibold">
            See All
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {suggestions?.length === 0 && (
            <p className="text-sm text-muted">You&apos;re all caught up 🎉</p>
          )}
          {suggestions?.map((person) => (
            <div key={person.id} className="flex items-center gap-3">
              <Avatar user={person} size={44} linkTo={`/u/${person.username}`} />
              <div className="min-w-0 flex-1">
                <Link href={`/u/${person.username}`} className="block truncate text-sm font-semibold">
                  {person.username}
                </Link>
                <p className="truncate text-xs text-muted">
                  {person.full_name || `${formatCount(person.followers_count)} followers`}
                </p>
              </div>
              <FollowButton
                username={person.username}
                initialFollowing={person.is_following}
                initialRequested={person.is_follow_requested}
                size="sm"
              />
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-line">
          © 2026 Gram · FastAPI + Next.js
        </p>
      </aside>
    </div>
  );
}
