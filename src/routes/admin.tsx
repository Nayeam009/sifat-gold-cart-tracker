import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LayoutDashboard, Package, Boxes, Tags, ShoppingBag, Users, TicketPercent, Images, Settings, LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin";
import { btnPrimary, inputCls } from "@/components/admin/confirm";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — SifatMart" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { to: "/admin/content", label: "Homepage & FAQs", icon: Images },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const auth = useAdminAuth();
  if (auth.status === "loading") return <p className="py-32 text-center text-muted-foreground">Checking access…</p>;
  if (auth.status === "signed_out") return <AdminLogin />;
  if (auth.status === "forbidden")
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-3xl">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">You're signed in as {auth.user.email}, but this account isn't a SifatMart administrator.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-md border border-border px-4 py-2 text-sm">Back to shop</Link>
          <button className={btnPrimary} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    );
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <div className="p-5 font-display text-2xl text-primary">SifatMart <span className="text-sm text-muted-foreground">admin</span></div>
        <nav className="space-y-0.5 px-3">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
              activeProps={{ className: "bg-muted font-medium text-foreground" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-border p-4 text-xs text-muted-foreground">
          <p className="truncate">{auth.user.email}</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-2 flex items-center gap-1 text-foreground hover:underline"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          <Link to="/" className="mt-2 block hover:underline">View shop →</Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs" activeProps={{ className: "bg-muted font-medium" }}>{n.label}</Link>
          ))}
          <button onClick={() => supabase.auth.signOut()} className="whitespace-nowrap px-3 py-1.5 text-xs">Sign out</button>
        </nav>
        <main className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-sm py-24">
      <h1 className="text-center font-display text-3xl">Admin sign in</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Only approved SifatMart administrators can open the dashboard.</p>
      <form className="mt-8 space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        setBusy(false);
        if (error) setErr(error.message.includes("Invalid") ? "Wrong email or password." : error.message);
        else toast.success("Signed in");
      }}>
        <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1`} /></label>
        <label className="block text-sm">Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} mt-1`} /></label>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
