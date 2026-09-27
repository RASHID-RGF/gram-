import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import type { UserBrief } from "@/lib/types";

const PALETTE = [
  "#f58529",
  "#dd2a7b",
  "#8134af",
  "#515bd4",
  "#0095f6",
  "#17c964",
  "#f5a623",
  "#e1306c",
];

function initials(user?: UserBrief | null): string {
  const source = (user?.full_name || user?.username || "?").trim();
  return (source[0] || "?").toUpperCase();
}

function colorFor(user?: UserBrief | null): string {
  const key = (user?.username || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[key % PALETTE.length];
}

interface AvatarProps {
  user?: UserBrief | null;
  size?: number;
  ring?: boolean;
  linkTo?: string;
  className?: string;
}

export function Avatar({ user, size = 32, ring = false, linkTo, className = "" }: AvatarProps) {
  const radius = "rounded-full";
  const inner = user?.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(user.avatar_url)}
      alt={user.username}
      width={size}
      height={size}
      className={`${radius} object-cover`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={`${radius} flex items-center justify-center font-semibold text-white`}
      style={{
        width: size,
        height: size,
        background: colorFor(user),
        fontSize: Math.max(11, size * 0.4),
      }}
    >
      {initials(user)}
    </span>
  );

  const classes = ring
    ? `inline-flex rounded-full p-[2px] ${
        user ? "bg-[conic-gradient(from_210deg,#f58529,#dd2a7b,#8134af,#0095f6,#f58529)]" : "bg-line"
      } ${className}`
    : className;

  const content = <span className={classes}>{inner}</span>;

  if (linkTo) {
    return (
      <Link href={linkTo} className="shrink-0" aria-label={user?.username}>
        {content}
      </Link>
    );
  }
  return content;
}
