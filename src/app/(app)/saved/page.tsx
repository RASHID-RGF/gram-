"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/api";
import { useSaved } from "@/lib/queries";
import { EmptyState, LoadingBlock } from "@/components/Feedback";
import { BookmarkIcon } from "@/components/Icons";

export default function SavedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useSaved(Boolean(user));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-0">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground">
          <BookmarkIcon filled width={22} height={22} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Saved</h1>
          <p className="text-sm text-muted">Only you can see what you&apos;ve saved</p>
        </div>
      </div>

      {isLoading && <LoadingBlock label="Loading saved posts…" />}

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <EmptyState
          title="Nothing saved yet"
          description="Save photos and videos to keep them in a private collection."
          action={
            <button
              type="button"
              onClick={() => router.push("/explore")}
              className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Explore
            </button>
          }
        />
      )}

      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {data?.items.map((post) => (
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

      <p className="mt-10 text-center text-sm text-muted">
        Looking for something?{" "}
        <Link href="/explore" className="font-semibold text-brand">
          Explore
        </Link>
      </p>
    </div>
  );
}
