import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth";
import { AuthCard, Field, FormAlert, authBtn, authInput } from "@/components/site/auth-card";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ next: z.string().optional() }),
  head: () => ({ meta: [...seo("Create Account", "Create a free SifatMart account to save addresses, track orders and keep a wishlist.").meta, { name: "robots", content: "noindex" }] }),
  component: Signup,
});

function Signup() {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (f.name.trim().length < 2) v["name"] = "Please enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) v["email"] = "Please enter a valid email address.";
    if (f.password.length < 8) v["password"] = "Use at least 8 characters.";
    if (f.confirm !== f.password) v["confirm"] = "Passwords don't match.";
    setErrs(v);
    setErr(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: { emailRedirectTo: `${window.location.origin}/account`, data: { full_name: f.name.trim().slice(0, 100) } },
    });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error.message));
    setSent(true);
  };

  if (sent)
    return (
      <AuthCard title="Check your email" sub={`We've sent a verification link to ${f.email.trim()}.`}>
        <p className="text-sm text-muted-foreground">Open the link to confirm your account, then sign in. Didn't get it? Check your spam folder.</p>
        <Link to="/login" className={`${authBtn} mt-6 block text-center`}>Go to sign in</Link>
      </AuthCard>
    );

  const fld = (k: keyof typeof f, label: string, type: string, ac: string) => (
    <Field id={k} label={label} error={errs[k]}>
      <input id={k} type={type} autoComplete={ac} value={f[k]} onChange={set(k)} className={authInput} maxLength={k === "name" ? 100 : 254} aria-invalid={!!errs[k]} aria-describedby={errs[k] ? `${k}-err` : undefined} />
    </Field>
  );

  return (
    <AuthCard title="Create your account" sub="Optional — you can always check out as a guest.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <FormAlert>{err}</FormAlert>}
        {fld("name", "Full name", "text", "name")}
        {fld("email", "Email", "email", "email")}
        {fld("password", "Password", "password", "new-password")}
        {fld("confirm", "Confirm password", "password", "new-password")}
        <button disabled={busy} className={authBtn}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-5 text-sm">Already have an account? <Link to="/login" className="text-primary underline">Sign in</Link></p>
    </AuthCard>
  );
}
