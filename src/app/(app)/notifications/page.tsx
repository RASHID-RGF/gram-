"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { timeAgo, titleCase } from "@/lib/format";
import { useNotifications } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { EmptyState, LoadingBlock } from "@/components/Feedback";
import { HeartIcon } from "@/components/Icons";

const ICONS: Record<string, string> = {
  like: "❤️",
  comment: "💬",
  follow: "➕",
  follow_request: "🙋",
  mention: "@",
  comment_like: "❤️",
  story_view: "👁️",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useNotifications();

  useEffect(() => {
    const timer = setTimeout(() => {
      void api("/notifications/read?all=true", { method: "POST", body: "[]" }).catch(
        () => undefined,
      );
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, 1200);
    return () => clearTimeout(timer);
  }, [queryClient]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:px-0">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <button
          type="button"
          className="text-sm font-semibold text-brand"
          onClick={() => {
            void api("/notifications/read?all=true", { method: "POST", body: "[]" }).catch(
              () => undefined,
            );
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        >
          Mark all read
        </button>
      </div>

      {isLoading && <LoadingBlock label="Loading notifications…" />}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          title="Nothing yet"
          description="When someone likes or comments on one of your posts, you'll see it here."
        />
      )}

      <div className="space-y-1">
        {data?.items.map((item) => (
          <Link
            key={item.id}
            href={
              item.type === "follow" || item.type === "follow_request"
                ? `/u/${item.actor.username}`
                : item.post_id
                  ? `/p/${item.post_id}`
                  : `/u/${item.actor.username}`
            }
            className={`flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-white ${
              item.is_read ? "" : "bg-white"
            }`}
          >
            <Avatar user={item.actor} size={44} linkTo={`/u/${item.actor.username}`} />
            <p className="min-w-0 flex-1 text-sm leading-snug">
              <span className="font-semibold">{item.actor.username}</span>{" "}
              <span className="text-muted">{describe(item.type)}</span>{" "}
              {item.text && (
                <span className="truncate text-muted">
                  — {item.text.split(": ").slice(1).join(": ") || item.text}
                </span>
              )}
              <span className="ml-1 text-xs text-muted">· {timeAgo(item.created_at)}</span>
            </p>
            <span className="shrink-0 text-lg" aria-hidden>
              {item.type === "like" ? (
                <span className="text-red-500">
                  <HeartIcon filled width={20} height={20} />
                </span>
              ) : (
                ICONS[item.type] ?? "🔔"
              )}
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">{titleCase("you're all caught up")}</p>
    </div>
  );
}

function describe(type: string): string {
  switch (type) {
    case "like":
      return "liked your post.";
    case "comment":
      return "commented on your post.";
    case "comment_like":
      return "liked your comment.";
    case "follow":
      return "started following you.";
    case "follow_request":
      return "requested to follow you.";
    case "mention":
      return "mentioned you in a post.";
    case "story_view":
      return "viewed your story.";
    default:
      return "interacted with you.";
  }
}
