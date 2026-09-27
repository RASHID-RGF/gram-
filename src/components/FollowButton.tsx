"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import type { User } from "@/lib/types";

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
  initialRequested?: boolean;
  isSelf?: boolean;
  onChange?: (state: { following: boolean; requested: boolean }) => void;
  size?: "sm" | "md";
}

export function FollowButton({
  username,
  initialFollowing,
  initialRequested = false,
  isSelf = false,
  onChange,
  size = "md",
}: FollowButtonProps) {
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(initialFollowing);
  const [requested, setRequested] = useState(initialRequested);
  const [busy, setBusy] = useState(false);

  if (isSelf) return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const wasFollowing = following;
    const wasRequested = requested;
    const willFollow = !(wasFollowing || wasRequested);

    setFollowing(willFollow);
    setRequested(willFollow ? wasRequested : false);

    try {
      const result = await api<{ status: string; requested?: boolean }>(
        `/users/${username}/follow`,
        { method: willFollow ? "POST" : "DELETE" },
      );
      const nowFollowing = result.status === "accepted";
      const nowRequested = result.status === "pending";
      setFollowing(nowFollowing);
      setRequested(nowRequested);
      onChange?.({ following: nowFollowing, requested: nowRequested });
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      setFollowing(wasFollowing);
      setRequested(wasRequested);
    } finally {
      setBusy(false);
    }
  }

  const label = requested ? "Requested" : following ? "Following" : "Follow";
  const classes =
    size === "sm"
      ? "px-3 py-1 text-xs"
      : "min-w-24 px-4 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`rounded-md font-semibold transition disabled:opacity-60 ${
        following || requested
          ? "border bg-subtle text-foreground hover:bg-line"
          : "bg-brand text-white hover:bg-brand-dark"
      } ${classes}`}
    >
      {label}
    </button>
  );
}

export function UserRow({
  user,
  action,
  href,
}: {
  user: Pick<User, "id" | "username" | "full_name" | "avatar_url" | "is_verified">;
  action?: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <a href={href ?? `/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-subtle">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(user.avatar_url)} alt={user.username} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-semibold text-muted">
              {user.username[0]?.toUpperCase()}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user.username}</span>
          <span className="block truncate text-xs text-muted">{user.full_name || " "}</span>
        </span>
      </a>
      {action}
    </div>
  );
}
