"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mediaUrl } from "@/lib/api";
import { useSearch, useTrendingHashtags } from "@/lib/queries";
import { formatCount } from "@/lib/format";
import { Avatar } from "./Avatar";
import { CloseIcon, SearchIcon } from "./Icons";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data, isFetching } = useSearch(query, query.trim().length > 0);
  const { data: trending } = useTrendingHashtags(query.trim().length === 0);

  function go(path: string) {
    onClose();
    router.push(path);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close search"
        className="flex-1 bg-black/50"
        onClick={onClose}
      />
      <div className="flex h-full w-full max-w-sm flex-col border-l bg-white shadow-xl animate-fade-in">
        <div className="flex items-center justify-between border-b px-4 py-4">
          <h2 className="text-xl font-semibold">Search</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <CloseIcon />
          </button>
        </div>

        <div className="border-b p-4">
          <div className="flex items-center gap-2 rounded-lg bg-subtle px-3 py-2">
            <SearchIcon width={18} height={18} className="text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users, hashtags, posts"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {query.trim().length === 0 && (
            <>
              <p className="px-3 py-2 text-sm font-semibold">Popular hashtags</p>
              {trending?.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted">Nothing trending yet.</p>
              )}
              {trending?.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => go(`/hashtag/${tag.name}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-subtle"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-lg font-semibold">
                    #
                  </span>
                  <span>
                    <span className="block text-sm font-medium">#{tag.name}</span>
                    <span className="block text-xs text-muted">
                      {formatCount(tag.post_count)} posts
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {query.trim().length > 0 && (
            <>
              <p className="px-3 py-2 text-sm font-semibold">Accounts</p>
              {data?.users?.length === 0 && !isFetching && (
                <p className="px-3 py-2 text-sm text-muted">No accounts found.</p>
              )}
              {data?.users?.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => go(`/u/${person.username}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-subtle"
                >
                  <Avatar user={person} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{person.username}</span>
                    <span className="block truncate text-xs text-muted">
                      {person.full_name || "—"} · {formatCount(person.followers_count)} followers
                    </span>
                  </span>
                </button>
              ))}

              {data?.hashtags && data.hashtags.length > 0 && (
                <>
                  <p className="px-3 pb-2 pt-4 text-sm font-semibold">Hashtags</p>
                  {data.hashtags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => go(`/hashtag/${tag.name}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-subtle"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-lg font-semibold">
                        #
                      </span>
                      <span>
                        <span className="block text-sm font-medium">#{tag.name}</span>
                        <span className="block text-xs text-muted">
                          {formatCount(tag.post_count)} posts
                        </span>
                      </span>
                    </button>
                  ))}
                </>
              )}

              {data?.posts && data.posts.length > 0 && (
                <>
                  <p className="px-3 pb-2 pt-4 text-sm font-semibold">Posts</p>
                  <div className="grid grid-cols-3 gap-1 px-2">
                    {data.posts.slice(0, 6).map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => go(`/p/${post.id}`)}
                        className="aspect-square overflow-hidden rounded bg-subtle"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaUrl(post.media[0]?.url)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
