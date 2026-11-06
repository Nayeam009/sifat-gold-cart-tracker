import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, inputCls } from "@/components/admin/confirm";

export function ChangePassword() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setErr(error.message);
      toast.error("Could not change password");
      return;
    }
    setPw("");
    setPw2("");
    toast.success("Password updated");
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{email || "…"}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">New password</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              className={inputCls + " pr-11"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Confirm new password</span>
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            className={inputCls}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
          />
        </label>
      </div>
      {err && (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      )}
      <button type="submit" className={btnPrimary + " min-h-11"} disabled={busy}>
        <KeyRound className="h-4 w-4" /> {busy ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
