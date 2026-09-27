"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signUp({
        email: email.trim(),
        username: username.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      router.replace("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-4xl italic tracking-tight">Gram</h1>
        <p className="mb-6 text-center text-sm text-muted">
          Sign up to see photos and videos from your friends.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border bg-subtle px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="w-full rounded-md border bg-subtle px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
            autoComplete="username"
            minLength={3}
            maxLength={30}
            required
          />
          <input
            className="w-full rounded-md border bg-subtle px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
          />
          <input
            className="w-full rounded-md border bg-subtle px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Password (8+ characters)"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <p className="text-xs text-muted">
            By signing up you agree to our Terms, Privacy Policy and Cookies Policy.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
