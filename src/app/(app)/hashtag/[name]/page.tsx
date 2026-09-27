"use client";

import { useParams, useRouter } from "next/navigation";
import { mediaUrl } from "@/lib/api";
import { useHashtag } from "@/lib/queries";
import { formatCount } from "@/lib/format";
import { EmptyState, LoadingBlock } from "@/components/Feedback";
import { CommentIcon, HeartIcon } from "@/components/Icons";

export default function HashtagPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const { data, isLoading } = useHashtag(name);
  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-0">
      <header className="mb-6 flex items-center gap-4">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-subtle text-4xl font-light text-muted">
          #
        </span>
        <div>
          <h1 className="text-2xl font-semibold">#{name}</h1>
          <p className="text-sm text-muted">
            {formatCount(data?.total ?? 0)} posts
          </p>
        </div>
      </header>

      {isLoading && <LoadingBlock label="Loading posts…" />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          title={`No posts yet with #${name}`}
          description="Be the first to use this hashtag."
        />
      )}

      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {items.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => router.push(`/p/${post.id}`)}
            className="group relative aspect-square overflow-hidden bg-subtle"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(post.media[0]?.url)}
              alt=""
              className="h-full w-full object-cover transition group-hover:brightness-75"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center gap-5 bg-black/45 opacity-0 transition group-hover:opacity-100">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <HeartIcon filled width={18} height={18} /> {formatCount(post.like_count)}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <CommentIcon width={18} height={18} /> {formatCount(post.comment_count)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
