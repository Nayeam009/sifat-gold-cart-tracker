import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, safeNext } from "@/lib/auth";
import { AuthCard, Field, FormAlert, authBtn, authInput } from "@/components/site/auth-card";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ next: z.string().optional() }),
  head: () => ({
    meta: [
      ...seo(
        "Sign In",
        "Sign in to your SifatMart account to see orders, addresses and your wishlist.",
      ).meta,
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return setErr("Please enter a valid email address.");
    if (!password) return setErr("Please enter your password.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error.message));
    navigate({ to: safeNext(next) });
  };

  return (
    <AuthCard
      title="Welcome back"
      sub="Sign in to track orders and keep your wishlist. Guests can still check out without an account."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <FormAlert>{err}</FormAlert>}
        <Field id="email" label="Email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInput}
            maxLength={254}
          />
        </Field>
        <Field id="password" label="Password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInput}
          />
        </Field>
        <button disabled={busy} className={authBtn}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
        <Link to="/forgot-password" className="text-primary underline">
          Forgot password?
        </Link>
        <Link to="/signup" search={next ? { next } : {}} className="text-primary underline">
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
}
