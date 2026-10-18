import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth";
import { AuthCard, Field, FormAlert, authBtn, authInput } from "@/components/site/auth-card";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [...seo("Choose a New Password", "Set a new password for your SifatMart account.").meta, { name: "robots", content: "noindex" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"wait" | "ok" | "invalid">("wait");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady("ok"); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady("ok"); });
    const t = setTimeout(() => setReady((r) => (r === "wait" ? "invalid" : r)), 4000);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== confirm) return setErr("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error.message));
    toast.success("Password updated");
    navigate({ to: "/account" });
  };

  if (ready === "wait") return <AuthCard title="Checking your link…"><p className="text-sm text-muted-foreground" role="status">One moment.</p></AuthCard>;
  if (ready === "invalid")
    return (
      <AuthCard title="Link expired" sub="This reset link is invalid or has expired.">
        <Link to="/forgot-password" className={`${authBtn} block text-center`}>Request a new link</Link>
      </AuthCard>
    );
  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <FormAlert>{err}</FormAlert>}
        <Field id="pw" label="New password"><input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={authInput} /></Field>
        <Field id="pw2" label="Confirm new password"><input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={authInput} /></Field>
        <button disabled={busy} className={authBtn}>{busy ? "Saving…" : "Update password"}</button>
      </form>
    </AuthCard>
  );
}
