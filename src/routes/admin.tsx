import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, ShieldAlert, Menu, MoreHorizontal, Store, PanelLeftClose, PanelLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin";
import { btnPrimary, inputCls } from "@/components/admin/confirm";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAV_GROUPS, SETTINGS_ITEM, BOTTOM_TABS, type NavItem } from "@/components/admin/admin-nav";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin — SifatMart" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function NavLinkItem({ n, collapsed, onNav }: { n: NavItem; collapsed?: boolean | undefined; onNav?: (() => void) | undefined }) {
  return (
    <Link
      to={n.to}
      onClick={onNav}
      activeOptions={{ exact: !!n.exact }}
      title={collapsed ? n.label : undefined}
      aria-label={collapsed ? n.label : undefined}
      className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-foreground/80 transition-colors hover:bg-muted md:min-h-[clamp(32px,4.6vh,40px)]"
      activeProps={{ className: "bg-primary/10 font-medium !text-foreground" }}
    >
      <n.icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{n.label}</span>}
    </Link>
  );
}

function NavList({ collapsed, onNav }: { collapsed?: boolean | undefined; onNav?: (() => void) | undefined }) {
  return (
    <nav aria-label="Admin" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3">
      {NAV_GROUPS.map((g) => (
        <div key={g.title}>
          {!collapsed && (
            <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {g.title}
            </p>
          )}
          <div className="space-y-0.5">
            {g.items.map((n) => (
              <NavLinkItem key={n.to} n={n} collapsed={collapsed} onNav={onNav} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

const signOut = () => supabase.auth.signOut();

function AdminLayout() {
  const auth = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (auth.status === "loading")
    return <p className="py-32 text-center text-muted-foreground">Checking access…</p>;
  if (auth.status === "signed_out") return <AdminLogin />;
  if (auth.status === "forbidden")
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-3xl">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed in as {auth.user.email}, but this account isn't a SifatMart administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-md border border-border px-4 py-2 text-sm">
            Back to shop
          </Link>
          <button className={btnPrimary} onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  const allItems = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];
  const current =
    [...allItems].sort((a, b) => b.to.length - a.to.length).find((n) =>
      n.exact ? path === n.to || path === n.to + "/" : path.startsWith(n.to),
    )?.label ?? "Admin";
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card md:flex ${collapsed ? "w-16" : "w-60"}`}
      >
        <div className="flex items-center justify-between gap-2 p-4">
          {!collapsed && (
            <Link to="/admin" className="font-display text-2xl text-primary">
              SifatMart <span className="text-sm text-muted-foreground">admin</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <NavList collapsed={collapsed} />
        <div className="space-y-0.5 border-t border-border p-3">
          <NavLinkItem n={SETTINGS_ITEM} collapsed={collapsed} />
          <Link
            to="/"
            title="View shop"
            className="flex min-h-9 items-center gap-3 rounded-md px-3 text-sm text-foreground/80 hover:bg-muted"
          >
            <Store className="h-4 w-4" aria-hidden /> {!collapsed && "View shop"}
          </Link>
          <button
            onClick={signOut}
            title="Sign out"
            className="flex min-h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-foreground/80 hover:bg-muted"
          >
            <LogOut className="h-4 w-4" aria-hidden /> {!collapsed && "Sign out"}
          </button>
          {!collapsed && <p className="truncate px-3 pt-1 text-xs text-muted-foreground">{auth.user.email}</p>}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-2 backdrop-blur md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate font-display text-xl">{current}</span>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="p-4 text-left">
              <SheetTitle className="font-display text-2xl text-primary">SifatMart admin</SheetTitle>
            </SheetHeader>
            <NavList onNav={() => setOpen(false)} />
            <div className="space-y-0.5 border-t border-border p-3">
              <NavLinkItem n={SETTINGS_ITEM} onNav={() => setOpen(false)} />
              <Link to="/" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm hover:bg-muted">
                <Store className="h-4 w-4" /> View shop
              </Link>
              <button
                onClick={signOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
              <p className="truncate px-3 pt-1 text-xs text-muted-foreground">{auth.user.email}</p>
            </div>
          </SheetContent>
        </Sheet>
        <main className="mx-auto max-w-6xl p-4 pb-24 md:p-8">
          <Outlet />
        </main>
        <nav
          aria-label="Quick admin tabs"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          {BOTTOM_TABS.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: !!n.exact }}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
              activeProps={{ className: "!text-primary font-medium" }}
            >
              <n.icon className="h-5 w-5" aria-hidden />
              {n.label}
            </Link>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            More
          </button>
        </nav>
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
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-center font-display text-3xl">Admin sign in</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Only approved SifatMart administrators can open the dashboard.
      </p>
      <form
        className="mt-8 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          setBusy(false);
          if (error)
            setErr(error.message.includes("Invalid") ? "Wrong email or password." : error.message);
          else toast.success("Signed in");
        }}
      >
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        {err && (
          <p role="alert" className="text-sm text-destructive">
            {err}
          </p>
        )}
        <button className={`${btnPrimary} w-full`} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
