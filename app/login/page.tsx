"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, fieldClassName, labelClassName } from "../components/brand";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Login failed");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-16">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
        Meal Prep
      </p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Household login</h1>
      <p className="mt-2 text-sm text-muted">
        Shared password for this private meal-prep app.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClassName}
          />
        </div>
        {error && (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="w-full"
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
