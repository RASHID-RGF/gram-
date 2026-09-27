"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("demo");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(identifier.trim(), password);
      router.replace("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-4xl italic tracking-tight">Gram</h1>
        <p className="mb-6 text-center text-sm text-muted">
          Sign in to see what your friends are sharing.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border bg-subtle px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Username or email"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="w-full rounded-md border bg-subtle px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          OR
          <span className="h-px flex-1 bg-line" />
        </div>

        <p className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand">
            Sign up
          </Link>
        </p>

        <p className="mt-6 rounded-md bg-canvas p-3 text-center text-xs text-muted">
          Demo account — <span className="font-semibold">demo</span> /{" "}
          <span className="font-semibold">demo12345</span>
        </p>
      </div>
    </main>
  );
}
