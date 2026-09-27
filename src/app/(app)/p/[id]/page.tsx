"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/format";
import { usePost } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { CommentsPanel } from "@/components/CommentsPanel";
import { LoadingBlock } from "@/components/Feedback";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CommentIcon,
  HeartIcon,
  SendIcon,
} from "@/components/Icons";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: post, isLoading, isError } = usePost(id);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);

  if (isLoading) return <LoadingBlock label="Loading post…" />;
  if (isError || !post) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold">Post not found</p>
        <button type="button" onClick={() => router.back()} className="mt-3 text-sm text-brand">
          Go back
        </button>
      </div>
    );
  }

  const isLiked = liked ?? post.liked;
  const isSaved = saved ?? post.saved;
  const media = post.media[index] ?? post.media[0];

  async function toggleLike() {
    const next = !isLiked;
    setLiked(next);
    try {
      await api(`/posts/${post!.id}/like`, { method: next ? "POST" : "DELETE" });
      void queryClient.invalidateQueries({ queryKey: ["post", post!.id] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      setLiked(!next);
    }
  }

  async function toggleSave() {
    const next = !isSaved;
    setSaved(next);
    try {
      await api(`/posts/${post!.id}/save`, { method: next ? "POST" : "DELETE" });
      void queryClient.invalidateQueries({ queryKey: ["post", post!.id] });
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
    } catch {
      setSaved(!next);
    }
  }

  return (
    <div className="md:py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-2 hidden items-center gap-1 px-1 text-sm text-muted hover:text-foreground md:flex"
      >
        <ChevronLeftIcon width={16} height={16} /> Back
      </button>

      <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden border bg-white md:h-[640px] md:flex-row md:rounded-md md:border">
        {/* media column */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center bg-black">
          <div
            className="flex h-full w-full transition-transform duration-300"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {post.media.map((item) => (
              <div key={item.id} className="flex h-full w-full shrink-0 items-center justify-center">
                {item.media_type === "video" ? (
                  <video src={mediaUrl(item.url)} controls className="max-h-full max-w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(item.url)}
                    alt={post.caption || "post"}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            ))}
          </div>

          {post.media.length > 1 && (
            <>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="absolute left-2 rounded-full bg-white/85 p-1.5"
                  aria-label="Previous"
                >
                  <ChevronLeftIcon width={18} height={18} />
                </button>
              )}
              {index < post.media.length - 1 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="absolute right-2 rounded-full bg-white/85 p-1.5"
                  aria-label="Next"
                >
                  <ChevronRightIcon width={18} height={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* details column */}
        <div className="flex w-full flex-col border-l md:w-[400px]">
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Avatar user={post.user} size={34} linkTo={`/u/${post.user.username}`} />
            <Link href={`/u/${post.user.username}`} className="flex-1 text-sm font-semibold">
              {post.user.username}
            </Link>
            <span className="text-xs text-muted">{timeAgo(post.created_at)}</span>
          </header>

          <div className="min-h-0 flex-1">
            <CommentsPanel postId={post.id} />
          </div>

          <div className="border-t px-4 pt-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleLike}
                className={isLiked ? "text-red-500" : "hover:opacity-60"}
                aria-label="Like"
              >
                <HeartIcon filled={isLiked} />
              </button>
              <span className="text-muted">
                <CommentIcon />
              </span>
              <button type="button" className="text-muted hover:text-foreground" aria-label="Share">
                <SendIcon />
              </button>
              <button
                type="button"
                onClick={toggleSave}
                className={`ml-auto ${isSaved ? "text-foreground" : "text-muted hover:text-foreground"}`}
                aria-label="Save"
              >
                <BookmarkIcon filled={isSaved} />
              </button>
            </div>

            <p className="mt-2.5 text-sm font-semibold">
              {formatCount(post.like_count)} likes
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatCount(post.comment_count)} comments
            </p>
            <p className="mb-3 mt-1 text-[11px] uppercase tracking-wide text-muted">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      {media === undefined && null}
    </div>
  );
}
