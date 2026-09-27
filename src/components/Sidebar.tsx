"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUnreadNotifications } from "@/lib/queries";
import { formatCount } from "@/lib/format";
import { Avatar } from "./Avatar";
import {
  CompassIcon,
  HeartIcon,
  HomeIcon,
  MenuIcon,
  PlusSquareIcon,
  SearchIcon,
  SendIcon,
} from "./Icons";
import { SearchOverlay } from "./SearchOverlay";

interface SidebarProps {
  onSearchOpen: () => void;
}

export function Sidebar({ onSearchOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: unread } = useUnreadNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadCount = unread?.unread ?? 0;
  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const items = [
    { label: "Home", href: "/feed", icon: HomeIcon, filled: active("/feed") },
    { label: "Search", onClick: onSearchOpen, icon: SearchIcon },
    { label: "Explore", href: "/explore", icon: CompassIcon, filled: active("/explore") },
    {
      label: "Messages",
      href: "/messages",
      icon: SendIcon,
      filled: active("/messages"),
      badge: 0,
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: HeartIcon,
      filled: active("/notifications"),
      badge: unreadCount,
    },
    { label: "Create", href: "/create", icon: PlusSquareIcon, filled: active("/create") },
    {
      label: "Profile",
      href: user ? `/u/${user.username}` : "/feed",
      avatar: true,
      filled: user ? active(`/u/${user.username}`) : false,
    },
  ];

  return (
    <>
      <nav className="fixed inset-y-0 left-0 z-40 hidden w-[73px] flex-col justify-between border-r bg-white px-3 py-5 md:flex xl:w-[245px]">
        <div className="flex flex-col gap-1">
          <Link
            href="/feed"
            className="mb-5 mt-1 px-3 py-2 font-serif text-2xl italic tracking-tight xl:text-3xl"
          >
            <span className="xl:hidden">G</span>
            <span className="hidden xl:inline">Gram</span>
          </Link>

          {items.map((item) => {
            const Icon = item.icon;
            const body = (
              <span className="flex items-center gap-4 px-3 py-3 transition hover:opacity-60">
                <span className="relative shrink-0">
                  {item.avatar ? (
                    <span
                      className={`block rounded-full p-[2px] ${
                        item.filled ? "bg-foreground" : ""
                      }`}
                    >
                      <Avatar user={user} size={24} />
                    </span>
                  ) : Icon ? (
                    <Icon filled={item.filled} strokeWidth={item.filled ? 2.4 : 1.8} />
                  ) : null}
                  {item.badge ? (
                    <span className="absolute -right-1.5 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                      {item.badge > 9 ? "9+" : formatCount(item.badge)}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`hidden text-[15px] xl:inline ${item.filled ? "font-bold" : ""}`}
                >
                  {item.label}
                </span>
              </span>
            );

            return item.href ? (
              <Link key={item.label} href={item.href} className="rounded-lg">
                {body}
              </Link>
            ) : (
              <button key={item.label} type="button" onClick={item.onClick} className="w-full rounded-lg text-left">
                {body}
              </button>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="w-full rounded-lg text-left"
            >
              <span className="flex items-center gap-4 px-3 py-3 transition hover:opacity-60">
                <MenuIcon />
                <span className="hidden text-[15px] xl:inline">More</span>
              </span>
            </button>
            {menuOpen && (
              <div className="absolute bottom-14 left-0 w-56 animate-fade-in rounded-xl border bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(`/u/${user?.username}`);
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-subtle"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-subtle"
                >
                  Your activity
                </button>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-subtle"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="px-3 text-[11px] leading-relaxed text-muted">
          <span className="hidden xl:inline">Gram · clone built with FastAPI + Next.js</span>
        </p>
      </nav>

      {/* mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-white py-2.5 md:hidden">
        {items
          .filter((item) => item.label !== "Create" && item.label !== "Profile")
          .map((item) => {
            const Icon = item.icon;
            const content = (
              <span className="relative p-2">
                {Icon ? <Icon filled={item.filled} strokeWidth={item.filled ? 2.4 : 1.8} /> : null}
                {item.badge ? (
                  <span className="absolute right-0 top-0 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>
            );
            return item.href ? (
              <Link key={item.label} href={item.href}>
                {content}
              </Link>
            ) : (
              <button key={item.label} type="button" onClick={item.onClick}>
                {content}
              </button>
            );
          })}
        <Link href="/create" className="p-2">
          <PlusSquareIcon />
        </Link>
        <Link href={`/u/${user?.username}`} className="p-1">
          <Avatar user={user} size={26} />
        </Link>
      </nav>
    </>
  );
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <SearchOverlay onClose={onClose} />;
}
