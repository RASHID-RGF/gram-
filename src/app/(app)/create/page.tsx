"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CameraIcon, CloseIcon } from "@/components/Icons";
import { Spinner } from "@/components/Feedback";

export default function CreatePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  function pick(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const next = Array.from(fileList).slice(0, 10);
    setFiles(next);
    setPreviews((previous) => {
      previous.forEach((url) => URL.revokeObjectURL(url));
      return next.map((file) => URL.createObjectURL(file));
    });
    setStep(2);
  }

  function clear() {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setCaption("");
    setLocation("");
    setStep(1);
  }

  async function share(event: FormEvent) {
    event.preventDefault();
    if (files.length === 0) return;
    setBusy(true);
    setError(null);

    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    body.append("caption", caption);
    if (location.trim()) body.append("location", location.trim());

    try {
      await api("/posts", { method: "POST", body });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({ queryKey: ["explore"] });
      await queryClient.invalidateQueries({ queryKey: ["user-posts", user?.username] });
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.username] });
      clear();
      router.push(`/u/${user?.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const hashtagCount = (caption.match(/#[\w.]+/g) ?? []).length;
  const mentionCount = (caption.match(/@[\w.]+/g) ?? []).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-0">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : router.back())}
            className="text-sm text-muted hover:text-foreground"
          >
            {step === 2 ? "← Back" : "Cancel"}
          </button>
          <h1 className="text-sm font-semibold">Create new post</h1>
          {step === 2 ? (
            <button
              type="button"
              onClick={share}
              disabled={busy}
              className="text-sm font-semibold text-brand disabled:opacity-50"
            >
              {busy ? <Spinner size={16} /> : "Share"}
            </button>
          ) : (
            <span className="w-12" />
          )}
        </header>

        {step === 1 && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
            <CameraIcon width={64} height={64} className="text-muted" strokeWidth={1.2} />
            <p className="text-lg">Drag photos and videos here</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Select from computer
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={(event) => pick(event.target.files)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col md:flex-row">
            <div className="flex min-h-72 flex-1 items-center justify-center bg-black">
              <div className="flex w-full snap-x gap-1 overflow-x-auto">
                {previews.map((url) => (
                  <div key={url} className="relative h-72 w-full shrink-0 snap-center md:h-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="preview" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={share} className="w-full border-l p-4 md:w-80">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold">{user?.username}</span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="ml-auto text-xs font-semibold text-brand"
                >
                  Change media
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  multiple
                  className="hidden"
                  onChange={(event) => pick(event.target.files)}
                />
              </div>

              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Write a caption…"
                rows={7}
                maxLength={2200}
                className="w-full resize-none border-none text-sm outline-none"
              />
              <div className="flex items-center justify-between pb-3 text-xs text-muted">
                <span>{caption.length}/2,200</span>
                <span>
                  {hashtagCount} # · {mentionCount} @
                </span>
              </div>

              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Add location"
                maxLength={120}
                className="mb-3 w-full border-t py-3 text-sm outline-none"
              />

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted">
                  {files.length} file{files.length === 1 ? "" : "s"} selected
                </span>
                <button
                  type="button"
                  onClick={clear}
                  className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
                >
                  <CloseIcon width={14} height={14} /> Reset
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={busy || files.length === 0}
                className="mt-4 hidden w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 md:block"
              >
                {busy ? "Sharing…" : "Share post"}
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Posts are stored on the FastAPI server and served from{" "}
        <code>{mediaUrl("/uploads").replace(/^https?:\/\//, "")}</code>
      </p>
    </div>
  );
}
