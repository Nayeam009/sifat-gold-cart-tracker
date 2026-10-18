import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth";
import { AuthCard, Field, FormAlert, authBtn, authInput } from "@/components/site/auth-card";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [...seo("Reset Password", "Get a link to reset your SifatMart account password.").meta, { name: "robots", content: "noindex" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErr("Please enter a valid email address.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error && /rate limit/i.test(error.message)) return setErr(authErrorMessage(error.message));
    setSent(true); // same message whether or not the email exists, to avoid revealing accounts
  };

  return (
    <AuthCard title="Forgot your password?" sub="Enter your email and we'll send you a reset link.">
      {sent ? (
        <FormAlert tone="success">If an account exists for {email.trim()}, a reset link is on its way. Check your inbox and spam folder.</FormAlert>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {err && <FormAlert>{err}</FormAlert>}
          <Field id="email" label="Email"><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={authInput} maxLength={254} /></Field>
          <button disabled={busy} className={authBtn}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-5 text-sm"><Link to="/login" className="text-primary underline">Back to sign in</Link></p>
    </AuthCard>
  );
}
