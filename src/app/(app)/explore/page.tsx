"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { mediaUrl } from "@/lib/api";
import { useExplore } from "@/lib/queries";
import { formatCount } from "@/lib/format";
import { LoadingBlock } from "@/components/Feedback";
import { CommentIcon, HeartIcon } from "@/components/Icons";

export default function ExplorePage() {
  const router = useRouter();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useExplore();
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="px-4 py-6 md:px-0">
      <h1 className="mb-4 text-xl font-semibold">Explore</h1>

      {isLoading && <LoadingBlock label="Finding interesting posts…" />}

      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {posts.map((post, i) => {
          // every 5th tile spans two rows for an editorial rhythm
          const tall = i % 5 === 0;
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => router.push(`/p/${post.id}`)}
              className={`group relative overflow-hidden bg-subtle ${
                tall ? "row-span-2 aspect-[3/4] md:aspect-[4/5]" : "aspect-square"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(post.media[0]?.url)}
                alt={post.caption}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-0 flex items-center justify-center gap-6 bg-black/45 opacity-0 transition group-hover:opacity-100">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <HeartIcon filled width={18} height={18} /> {formatCount(post.like_count)}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <CommentIcon width={18} height={18} /> {formatCount(post.comment_count)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="py-8 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-md border bg-white px-5 py-2 text-sm font-semibold hover:bg-subtle"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <p className="py-16 text-center text-sm text-muted">
          Nothing to explore yet. <Link href="/create" className="font-semibold text-brand">Post something</Link>.
        </p>
      )}
    </div>
  );
}
