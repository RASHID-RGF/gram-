"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Avatar } from "./Avatar";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CommentIcon,
  DotsIcon,
  HeartIcon,
  SendIcon,
} from "./Icons";

interface PostCardProps {
  post: Post;
  onChanged?: (post: Post) => void;
  onOpen?: () => void;
  compact?: boolean;
}

export function PostCard({ post, onChanged, onOpen, compact = false }: PostCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [state, setState] = useState(post);
  const [index, setIndex] = useState(0);
  const [pop, setPop] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const update = useCallback(
    (next: Post) => {
      setState(next);
      onChanged?.(next);
    },
    [onChanged],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["feed"] });
    void queryClient.invalidateQueries({ queryKey: ["explore"] });
    void queryClient.invalidateQueries({ queryKey: ["post", state.id] });
    void queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    void queryClient.invalidateQueries({ queryKey: ["saved"] });
  };

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    const liked = !state.liked;
    update({
      ...state,
      liked,
      like_count: Math.max(0, state.like_count + (liked ? 1 : -1)),
    });
    setPop(true);
    setTimeout(() => setPop(false), 350);
    try {
      const result = await api<{ like_count: number }>(
        `/posts/${state.id}/like`,
        { method: liked ? "POST" : "DELETE" },
      );
      update({ ...state, liked, like_count: result.like_count });
      invalidate();
    } catch {
      update({
        ...state,
        liked: !liked,
        like_count: Math.max(0, state.like_count + (liked ? -1 : 1)),
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave() {
    const saved = !state.saved;
    update({ ...state, saved, save_count: Math.max(0, state.save_count + (saved ? 1 : -1)) });
    try {
      const result = await api<{ save_count: number }>(
        `/posts/${state.id}/save`,
        { method: saved ? "POST" : "DELETE" },
      );
      update({ ...state, saved, save_count: result.save_count });
      invalidate();
    } catch {
      update({
        ...state,
        saved: !saved,
        save_count: Math.max(0, state.save_count + (saved ? -1 : 1)),
      });
    }
  }

  async function submitComment() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      await api(`/posts/${state.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      update({ ...state, comment_count: state.comment_count + 1 });
      invalidate();
    } catch (error) {
      setDraft(text);
      window.alert(error instanceof Error ? error.message : "Could not post comment");
    }
  }

  const media = state.media[index] ?? state.media[0];
  const carousel = state.media.length > 1;

  return (
    <article className="border-b bg-white md:border md:rounded-lg md:mb-4">
      {/* header */}
      <header className="flex items-center gap-3 px-3 py-3 md:px-4">
        <Avatar user={state.user} size={34} ring linkTo={`/u/${state.user.username}`} />
        <div className="min-w-0 flex-1 leading-tight">
          <Link href={`/u/${state.user.username}`} className="text-sm font-semibold hover:opacity-60">
            {state.user.username}
          </Link>
          {state.location && (
            <p className="truncate text-xs text-muted">{state.location}</p>
          )}
        </div>
        <span className="text-xs text-muted">{timeAgo(state.created_at)}</span>
        <button type="button" className="text-muted hover:text-foreground" aria-label="More">
          <DotsIcon width={18} height={18} />
        </button>
      </header>

      {/* media */}
      <div
        className="relative select-none overflow-hidden bg-black"
        onDoubleClick={() => {
          if (!state.liked) void toggleLike();
        }}
      >
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {state.media.map((item) => (
            <div key={item.id} className="w-full shrink-0">
              {item.media_type === "video" ? (
                <video
                  src={mediaUrl(item.url)}
                  controls
                  playsInline
                  className="max-h-[70vh] w-full bg-black object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(item.url)}
                  alt={state.caption || "post"}
                  className="max-h-[70vh] w-full bg-black object-contain"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>

        {carousel && (
          <>
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 shadow"
                aria-label="Previous"
              >
                <ChevronLeftIcon width={18} height={18} />
              </button>
            )}
            {index < state.media.length - 1 && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(state.media.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 shadow"
                aria-label="Next"
              >
                <ChevronRightIcon width={18} height={18} />
              </button>
            )}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {state.media.map((item, i) => (
                <span
                  key={item.id}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-brand" : "bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}

        <span
          className={`pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 transition ${
            pop ? "animate-heart-pop opacity-90" : ""
          }`}
        >
          <HeartIcon filled width={96} height={96} strokeWidth={0} />
        </span>
      </div>

      {/* actions */}
      <div className="px-3 pt-3 md:px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleLike}
            aria-label={state.liked ? "Unlike" : "Like"}
            className={`transition ${state.liked ? "text-red-500" : "hover:opacity-60"}`}
          >
            <HeartIcon filled={state.liked} />
          </button>
          <button
            type="button"
            onClick={() => (onOpen ? onOpen() : router.push(`/p/${state.id}`))}
            aria-label="Comment"
            className="hover:opacity-60"
          >
            <CommentIcon />
          </button>
          <button
            type="button"
            aria-label="Share"
            className="hover:opacity-60"
            onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}/p/${state.id}`);
            }}
          >
            <SendIcon />
          </button>
          <button
            type="button"
            onClick={toggleSave}
            aria-label={state.saved ? "Unsave" : "Save"}
            className={`ml-auto transition ${state.saved ? "text-foreground" : "hover:opacity-60"}`}
          >
            <BookmarkIcon filled={state.saved} />
          </button>
        </div>

        {state.like_count > 0 && (
          <p className="mt-2.5 text-sm font-semibold">{formatCount(state.like_count)} likes</p>
        )}

        {state.caption && (
          <p className="mt-1.5 text-sm leading-snug">
            <Link href={`/u/${state.user.username}`} className="mr-1.5 font-semibold hover:opacity-60">
              {state.user.username}
            </Link>
            <span className="whitespace-pre-wrap">{renderCaption(state.caption)}</span>
          </p>
        )}

        {state.comment_count > 0 && (
          <button
            type="button"
            onClick={() => (onOpen ? onOpen() : router.push(`/p/${state.id}`))}
            className="mt-1.5 block text-sm text-muted hover:opacity-70"
          >
            View all {formatCount(state.comment_count)} comments
          </button>
        )}

        {!compact && (
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
            {timeAgo(state.created_at)}
          </p>
        )}

        {!onOpen && (
          <form
            className="mt-3 hidden items-center gap-2 border-t pt-3 md:flex"
            onSubmit={(event) => {
              event.preventDefault();
              void submitComment();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-sm outline-none"
              maxLength={1000}
            />
            {draft.trim() && (
              <button type="submit" className="text-sm font-semibold text-brand">
                Post
              </button>
            )}
          </form>
        )}
      </div>
      <div className="h-3" />
      {media === undefined && null}
    </article>
  );
}

function renderCaption(caption: string) {
  const parts = caption.split(/([#@][\w.]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <Link key={i} href={`/hashtag/${part.slice(1)}`} className="text-[#00376b] hover:underline">
          {part}
        </Link>
      );
    }
    if (part.startsWith("@")) {
      return (
        <Link key={i} href={`/u/${part.slice(1)}`} className="text-[#00376b] hover:underline">
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
