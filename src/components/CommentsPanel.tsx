"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/format";
import { useComments } from "@/lib/queries";
import type { Comment } from "@/lib/types";
import { Avatar } from "./Avatar";
import { HeartIcon } from "./Icons";
import { LoadingBlock } from "./Feedback";

interface CommentsPanelProps {
  postId: string;
  onCountChange?: (delta: number) => void;
  autoFocus?: boolean;
}

export function CommentsPanel({ postId, onCountChange, autoFocus }: CommentsPanelProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useComments(postId);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(text: string, parentId?: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await api(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: text.trim(), parent_id: parentId ?? null }),
      });
      onCountChange?.(1);
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      void queryClient.invalidateQueries({ queryKey: ["post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not post comment");
    } finally {
      setBusy(false);
      setDraft("");
    }
  }

  async function toggleLike(comment: Comment) {
    const liked = !comment.liked;
    await api(`/posts/comments/${comment.id}/like`, {
      method: liked ? "POST" : "DELETE",
    }).catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
  }

  if (isLoading) return <LoadingBlock label="Loading comments…" />;

  const comments = data?.items ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {comments.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No comments yet. Start the conversation.
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar user={comment.user} size={32} linkTo={`/u/${comment.user.username}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="mr-1.5 font-semibold">{comment.user.username}</span>
                <span className="break-words">{comment.text}</span>
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                <span>{timeAgo(comment.created_at)}</span>
                {comment.like_count > 0 && <span>{formatCount(comment.like_count)} likes</span>}
                <button type="button" className="font-semibold" onClick={() => setDraft(`@${comment.user.username} `)}>
                  Reply
                </button>
              </div>
              {comment.reply_count > 0 && (
                <button
                  type="button"
                  className="mt-1.5 text-xs font-semibold text-muted"
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ["comments", postId] })
                  }
                >
                  View {comment.reply_count} {comment.reply_count === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => void toggleLike(comment)}
              className={`mt-1 shrink-0 ${comment.liked ? "text-red-500" : "text-muted hover:text-foreground"}`}
              aria-label="Like comment"
            >
              <HeartIcon filled={comment.liked} width={14} height={14} />
            </button>
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(draft);
        }}
      >
        <input
          autoFocus={autoFocus}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment…"
          className="flex-1 bg-transparent text-sm outline-none"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          className="text-sm font-semibold text-brand disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  );
}
