"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useStories } from "@/lib/queries";
import type { StoryGroup, Story } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CloseIcon } from "./Icons";
import { Spinner } from "./Feedback";

const STORY_DURATION = 5000;

export function StoriesBar() {
  const { data, isLoading } = useStories();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto border-b bg-white px-4 py-4 md:rounded-lg md:border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 animate-pulse rounded-full bg-subtle" />
            <div className="h-3 w-12 animate-pulse rounded bg-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto border-b bg-white px-4 py-4 md:rounded-lg md:border">
        {data.map((group, i) => (
          <button
            key={group.user.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <Avatar user={group.user} size={56} ring={!group.all_seen} />
            <span className="w-full truncate text-center text-xs">
              {group.is_own ? "Your story" : group.user.username}
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <StoryViewer
          groups={data}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}

interface StoryViewerProps {
  groups: StoryGroup[];
  startIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function StoryViewer({ groups, startIndex, onClose, onNavigate }: StoryViewerProps) {
  const queryClient = useQueryClient();
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(0);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  useEffect(() => {
    if (!story || group?.is_own) return;
    void api(`/stories/${story.id}/view`, { method: "POST" }).catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: ["stories"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  function advance() {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      return;
    }
    if (groupIndex < groups.length - 1) {
      const next = groupIndex + 1;
      setGroupIndex(next);
      setStoryIndex(0);
      onNavigate(next);
      return;
    }
    onClose();
  }

  function back() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      return;
    }
    if (groupIndex > 0) {
      const previous = groupIndex - 1;
      setGroupIndex(previous);
      setStoryIndex(0);
      onNavigate(previous);
      return;
    }
    onClose();
  }

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 p-2 text-white/90 hover:text-white"
        aria-label="Close stories"
      >
        <CloseIcon width={28} height={28} />
      </button>

      <div className="relative h-full max-h-[92vh] w-full max-w-md overflow-hidden bg-black md:rounded-lg">
        <div className="absolute inset-0">
          {story.media_type === "video" ? (
            <video src={mediaUrl(story.media_url)} autoPlay muted className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(story.media_url)} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-3">
          <StoryProgress
            key={story.id}
            stories={group.stories}
            storyIndex={storyIndex}
            onComplete={advance}
          />
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar user={group.user} size={32} />
            <Link
              href={`/u/${group.user.username}`}
              onClick={onClose}
              className="text-sm font-semibold text-white"
            >
              {group.user.username}
            </Link>
            <span className="text-xs text-white/70">{timeAgo(story.created_at)}</span>
            {group.is_own && (
              <span className="ml-auto flex items-center gap-1 text-xs text-white/80">
                {story.view_count} views
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={back}
          className="absolute inset-y-0 left-0 w-1/3 cursor-default"
          aria-label="Previous story"
        />
        <button
          type="button"
          onClick={advance}
          className="absolute inset-y-0 right-0 w-1/3 cursor-default"
          aria-label="Next story"
        />

        {story.caption && (
          <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center text-sm text-white">
            {story.caption}
          </p>
        )}
      </div>

      <div className="absolute left-4 top-4 hidden gap-1 text-xs text-white/70 md:flex">
        <Spinner size={14} /> stories
      </div>
    </div>
  );
}

/** Auto-advancing progress bars; remounts (via `key`) for every story. */
function StoryProgress({
  stories,
  storyIndex,
  onComplete,
}: {
  stories: Story[];
  storyIndex: number;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const value = Math.min(1, (Date.now() - started) / STORY_DURATION);
      setProgress(value);
      if (value >= 1) {
        clearInterval(timer);
        completeRef.current();
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-1">
      {stories.map((item, i) => (
        <span key={item.id} className="h-0.5 flex-1 overflow-hidden rounded bg-white/40">
          <span
            className="block h-full bg-white"
            style={{
              width:
                i < storyIndex ? "100%" : i === storyIndex ? `${progress * 100}%` : "0%",
            }}
          />
        </span>
      ))}
    </div>
  );
}
