import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { PageHeader } from "@/components/site/page-header";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Account | SifatMart" },
      { name: "description", content: "Your SifatMart profile, addresses and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const s = useSession();
  const loc = useLocation();
  const navigate = useNavigate();
  if (s.status === "loading")
    return (
      <p role="status" className="py-32 text-center text-muted-foreground">
        Loading your account…
      </p>
    );
  if (s.status === "signed_out")
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Please sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to see your orders, saved addresses and wishlist. You can still shop and check out
          as a guest.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            search={{ next: loc.pathname }}
            className="rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            Sign in
          </Link>
          <Link to="/signup" className="rounded-md border border-border px-5 py-2.5 text-sm">
            Create account
          </Link>
        </div>
      </div>
    );
  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };
  const tab = "rounded-full px-4 py-1.5 text-sm hover:bg-secondary";
  return (
    <>
      <PageHeader eyebrow={s.user.email ?? "Account"} title="My Account" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav
          aria-label="Account"
          className="mb-8 flex flex-wrap items-center gap-2 border-b border-border pb-4"
        >
          <Link
            to="/account"
            activeOptions={{ exact: true }}
            className={tab}
            activeProps={{ className: "bg-secondary font-medium" }}
          >
            Profile & addresses
          </Link>
          <Link
            to="/account/orders"
            className={tab}
            activeProps={{ className: "bg-secondary font-medium" }}
          >
            My orders
          </Link>
          <Link to="/wishlist" className={tab}>
            Wishlist
          </Link>
          <button
            onClick={signOut}
            className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>
        <Outlet />
      </div>
    </>
  );
}
