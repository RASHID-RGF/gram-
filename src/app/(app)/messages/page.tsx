"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { useConversations, useMessages } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { EmptyState, LoadingBlock } from "@/components/Feedback";
import { SendIcon } from "@/components/Icons";

function MessagesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // undefined = visitor has not chosen yet, null = explicitly cleared
  const [chosenId, setChosenId] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const creatingRef = useRef<string | null>(null);

  const startWith = params.get("user");
  const { data: conversations, isLoading } = useConversations(Boolean(user));

  const paramConversationId = useMemo(() => {
    if (!startWith || !conversations) return null;
    const existing = conversations.find((conversation) =>
      conversation.participants.some((p) => p.username === startWith),
    );
    return existing?.id ?? null;
  }, [startWith, conversations]);

  const activeId =
    chosenId !== undefined
      ? chosenId
      : (paramConversationId ?? conversations?.[0]?.id ?? null);

  useEffect(() => {
    if (!startWith || !conversations || paramConversationId) return;
    if (creatingRef.current === startWith) return;
    creatingRef.current = startWith;

    api<{ id: string }>("/conversations", {
      method: "POST",
      body: JSON.stringify({ username: startWith }),
    })
      .then((conversation) => {
        setChosenId(conversation.id);
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .catch(() => router.replace("/messages"));
  }, [startWith, conversations, paramConversationId, queryClient, router]);

  const { data: messages, isLoading: messagesLoading } = useMessages(activeId ?? undefined);

  const active = useMemo(
    () => conversations?.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );
  const others = active?.participants.filter((p) => p.id !== user?.id) ?? [];
  const title = others.map((p) => p.username).join(", ") || "Conversation";

  useEffect(() => {
    if (!activeId) return;
    void api(`/conversations/${activeId}/read`, { method: "POST" }).catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [activeId, messages?.items.length, queryClient]);

  async function send() {
    const text = draft.trim();
    if (!text || !activeId || busy) return;
    setBusy(true);
    setDraft("");
    try {
      await api(`/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      void queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error) {
      setDraft(text);
      window.alert(error instanceof Error ? error.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] border bg-white md:h-[70vh] md:rounded-md md:border">
      {/* conversation list */}
      <aside
        className={`w-full shrink-0 overflow-y-auto border-r md:w-80 ${
          activeId ? "hidden md:block" : "block"
        }`}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <Link href={`/u/${user?.username}`} className="text-sm font-semibold">
            {user?.username}
          </Link>
          <span className="text-sm font-semibold">Messages</span>
        </header>

        {isLoading && <LoadingBlock label="Loading…" />}

        {conversations?.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">
            No conversations yet. Visit a profile and tap{" "}
            <span className="font-semibold">Message</span>.
          </p>
        )}

        {conversations?.map((conversation) => {
          const other = conversation.participants.find((p) => p.id !== user?.id);
          const isActive = conversation.id === activeId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setChosenId(conversation.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-subtle ${
                isActive ? "bg-subtle" : ""
              }`}
            >
              <Avatar user={other} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {other?.full_name || other?.username}
                </span>
                <span className="block truncate text-xs text-muted">
                  {conversation.last_message?.text ?? "Say hi 👋"} ·{" "}
                  {timeAgo(conversation.updated_at)}
                </span>
              </span>
              {conversation.unread_count > 0 && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </aside>

      {/* thread */}
      <section className={`flex min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {!activeId && (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="Your messages"
              description="Send a message to start a conversation."
            />
          </div>
        )}

        {activeId && (
          <>
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <button
                type="button"
                className="text-muted md:hidden"
                onClick={() => setChosenId(null)}
              >
                ←
              </button>
              <Avatar user={others[0]} size={34} />
              <Link href={`/u/${others[0]?.username}`} className="text-sm font-semibold">
                {title}
              </Link>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messagesLoading && <LoadingBlock label="Loading messages…" />}
              {messages?.items
                .slice()
                .reverse()
                .map((message) => {
                  const mine = message.sender.id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <span
                        className={`max-w-[75%] whitespace-pre-wrap rounded-3xl px-4 py-2 text-sm ${
                          mine ? "bg-brand text-white" : "bg-subtle text-foreground"
                        }`}
                      >
                        {message.text}
                      </span>
                    </div>
                  );
                })}
            </div>

            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message…"
                className="flex-1 rounded-full border bg-canvas px-4 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={!draft.trim() || busy}
                className="rounded-full p-2 text-brand disabled:opacity-40"
                aria-label="Send"
              >
                <SendIcon />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Opening messages…" />}>
      <MessagesInner />
    </Suspense>
  );
}
