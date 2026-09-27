"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCount } from "@/lib/format";
import { useFollowers, useFollowing, useProfile, useUserPosts } from "@/lib/queries";
import type { User } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { FollowButton, UserRow } from "@/components/FollowButton";
import { LoadingBlock } from "@/components/Feedback";
import { GridIcon, LinkIcon, LockIcon, TagIcon } from "@/components/Icons";

type ListKind = "followers" | "following" | null;

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const { data: profile, isLoading, isError } = useProfile(username);
  const { data: posts, isLoading: postsLoading } = useUserPosts(username);
  const [listKind, setListKind] = useState<ListKind>(null);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <LoadingBlock label="Loading profile…" />;
  if (isError || !profile) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold">User not found</p>
      </div>
    );
  }

  const isSelf = profile.is_self;
  const canSeePosts = !profile.is_private || profile.is_following || isSelf;
  const items = posts?.items ?? [];

  async function saveProfile(form: FormData) {
    const payload = {
      full_name: (form.get("full_name") as string) || null,
      bio: (form.get("bio") as string) || null,
      website: (form.get("website") as string) || null,
      is_private: form.get("is_private") === "on",
    };
    await api("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
    await queryClient.invalidateQueries({ queryKey: ["profile", username] });
    await queryClient.invalidateQueries({ queryKey: ["user-posts", username] });
    setEditing(false);
  }

  async function uploadAvatar(file: File) {
    const body = new FormData();
    body.append("file", file);
    await api("/users/me/avatar", { method: "POST", body });
    await queryClient.invalidateQueries({ queryKey: ["profile", username] });
    await queryClient.invalidateQueries({ queryKey: ["profile", me?.username] });
  }

  return (
    <div className="px-4 py-6 md:px-0">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:gap-16">
        <div className="flex items-center gap-6 md:block">
          <Avatar user={profile} size={90} />
          <div className="md:hidden">
            <h1 className="text-xl font-semibold">{profile.username}</h1>
          </div>
        </div>

        <div className="flex-1">
          <div className="hidden items-center gap-4 md:flex">
            <h1 className="text-2xl">{profile.username}</h1>
            {isSelf ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md border bg-subtle px-4 py-1.5 text-sm font-semibold hover:bg-line"
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/create")}
                  className="rounded-md border bg-subtle px-4 py-1.5 text-sm font-semibold hover:bg-line"
                >
                  New post
                </button>
              </>
            ) : (
              <>
                <FollowButton
                  username={profile.username}
                  initialFollowing={profile.is_following}
                  initialRequested={profile.is_follow_requested}
                />
                <button
                  type="button"
                  onClick={() => router.push(`/messages?user=${profile.username}`)}
                  className="rounded-md border bg-subtle px-4 py-1.5 text-sm font-semibold hover:bg-line"
                >
                  Message
                </button>
              </>
            )}
            <span className="text-xl text-muted">⋯</span>
          </div>

          <div className="mt-4 flex gap-8 text-sm md:mt-5">
            <button type="button" onClick={() => setListKind("followers")}>
              <span className="font-semibold">{formatCount(profile.posts_count)}</span> posts
            </button>
            <button type="button" onClick={() => setListKind("followers")}>
              <span className="font-semibold">{formatCount(profile.followers_count)}</span> followers
            </button>
            <button type="button" onClick={() => setListKind("following")}>
              <span className="font-semibold">{formatCount(profile.following_count)}</span> following
            </button>
          </div>

          <div className="mt-4 hidden text-sm md:block">
            <p className="font-semibold">{profile.full_name || profile.username}</p>
            {profile.bio && <p className="mt-1 whitespace-pre-wrap">{profile.bio}</p>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 flex items-center gap-1 font-semibold text-[#00376b]"
              >
                <LinkIcon width={14} height={14} /> {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {profile.is_private && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-muted">
              <LockIcon width={14} height={14} /> Private account
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 border-b md:hidden">
        <div className="flex gap-8 pb-3 text-sm">
          <span>
            <span className="font-semibold">{profile.posts_count}</span> posts
          </span>
          <button type="button" onClick={() => setListKind("followers")}>
            <span className="font-semibold">{profile.followers_count}</span> followers
          </button>
          <button type="button" onClick={() => setListKind("following")}>
            <span className="font-semibold">{profile.following_count}</span> following
          </button>
        </div>
        <div className="py-3 text-sm">
          <p className="font-semibold">{profile.full_name}</p>
          {profile.bio && <p className="whitespace-pre-wrap text-muted">{profile.bio}</p>}
        </div>
      </div>

      {/* mobile action row */}
      {!isSelf && (
        <div className="mt-4 flex gap-2 md:hidden">
          <FollowButton
            username={profile.username}
            initialFollowing={profile.is_following}
            initialRequested={profile.is_follow_requested}
          />
          <button
            type="button"
            onClick={() => router.push(`/messages?user=${profile.username}`)}
            className="flex-1 rounded-md border bg-subtle px-4 py-1.5 text-sm font-semibold"
          >
            Message
          </button>
        </div>
      )}

      {/* tabs */}
      <nav className="mt-8 flex justify-center gap-12 border-t text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="-mt-px flex items-center gap-1.5 border-t-2 border-foreground py-4 text-foreground">
          <GridIcon width={14} height={14} /> Posts
        </span>
        <span className="flex items-center gap-1.5 py-4 opacity-60">
          <TagIcon width={14} height={14} /> Tagged
        </span>
      </nav>

      {postsLoading && <LoadingBlock />}

      {!postsLoading && !canSeePosts && (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground">
            <LockIcon width={28} height={28} />
          </span>
          <p className="text-lg font-semibold">This account is private</p>
          <p className="text-sm text-muted">
            Follow {profile.username} to see their photos and videos.
          </p>
        </div>
      )}

      {!postsLoading && canSeePosts && items.length === 0 && (
        <p className="py-14 text-center text-sm text-muted">No posts yet.</p>
      )}

      {canSeePosts && items.length > 0 && (
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
            </button>
          ))}
        </div>
      )}

      {listKind && (
        <ListModal
          kind={listKind}
          username={profile.username}
          onClose={() => setListKind(null)}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            action={saveProfile}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-fade-in"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit profile</h2>
              <button type="button" onClick={() => setEditing(false)} className="text-muted">
                ✕
              </button>
            </div>

            <label className="mb-3 flex cursor-pointer items-center gap-3">
              <Avatar user={profile} size={48} />
              <span className="text-sm font-semibold text-brand">
                Change profile photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadAvatar(file);
                  }}
                />
              </span>
            </label>

            <label className="mb-3 block text-sm">
              Name
              <input
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="mb-3 block text-sm">
              Bio
              <textarea
                name="bio"
                defaultValue={profile.bio ?? ""}
                rows={3}
                maxLength={1500}
                className="mt-1 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="mb-3 block text-sm">
              Website
              <input
                name="website"
                defaultValue={profile.website ?? ""}
                placeholder="https://example.com"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="mb-5 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_private"
                defaultChecked={profile.is_private}
                className="h-4 w-4 accent-[#0095f6]"
              />
              Private account
            </label>

            <button
              type="submit"
              className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Save
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ListModal({
  kind,
  username,
  onClose,
}: {
  kind: "followers" | "following";
  username: string;
  onClose: () => void;
}) {
  const followers = useFollowers(username, kind === "followers");
  const following = useFollowing(username, kind === "following");
  const data = kind === "followers" ? followers.data : following.data;
  const isLoading = kind === "followers" ? followers.isLoading : following.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl animate-fade-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold capitalize">{kind}</h2>
          <button type="button" onClick={onClose} className="text-muted">
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] divide-y overflow-y-auto">
          {isLoading && <LoadingBlock />}
          {data?.items.map((person: User) => (
            <UserRow
              key={person.id}
              user={person}
              action={
                person.is_self ? null : (
                  <FollowButton
                    username={person.username}
                    initialFollowing={person.is_following}
                    initialRequested={person.is_follow_requested}
                    size="sm"
                  />
                )
              }
            />
          ))}
          {data?.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No one here yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
