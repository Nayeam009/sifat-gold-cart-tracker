import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SessionState = { status: "loading" } | { status: "signed_out" } | { status: "signed_in"; user: User };

/** Client-side session for UI only; the database's row-level security enforces who sees what. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => alive && setState(data.user ? { status: "signed_in", user: data.user } : { status: "signed_out" }));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED")
        setState(session?.user ? { status: "signed_in", user: session.user } : { status: "signed_out" });
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  return state;
}

/** Only allow same-site relative paths as post-login destinations. */
export const safeNext = (n: unknown) => (typeof n === "string" && /^\/(?!\/)[\w\-/.?=&%]*$/.test(n) && !n.startsWith("/admin") ? n : "/account");

export function authErrorMessage(msg: string | undefined): string {
  const m = (msg ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the verification link.";
  if (m.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password") && (m.includes("weak") || m.includes("pwned") || m.includes("least"))) return "Please choose a stronger password (at least 8 characters, not a common password).";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a minute and try again.";
  return "Something went wrong. Please try again.";
}
