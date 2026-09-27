"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/lib/ws";
import { LoadingBlock } from "./Feedback";
import { SearchModal, Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useRealtime((event) => {
    if (event.kind === "notification") {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const text = typeof event.text === "string" ? event.text : "New activity";
      setToast(text);
    }
    if (event.kind === "message") {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
  }, Boolean(user));

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Loading your feed…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <a href="/feed" className="font-serif text-2xl italic">
          Gram
        </a>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.6-3.6" strokeLinecap="round" />
            </svg>
          </button>
          <a href="/notifications" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20s-7.5-4.6-9.3-9A5.2 5.2 0 0 1 12 6.5 5.2 5.2 0 0 1 21.3 11c-1.8 4.4-9.3 9-9.3 9z" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </header>

      <Sidebar onSearchOpen={() => setSearchOpen(true)} />

      <main className="mx-auto min-h-screen max-w-5xl px-0 pb-16 md:px-6 md:pb-8 md:pl-[95px] xl:pl-[275px]">
        {children}
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg md:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}
