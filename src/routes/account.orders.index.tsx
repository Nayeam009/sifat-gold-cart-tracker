import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/account";
import { FormAlert } from "@/components/site/auth-card";

export const Route = createFileRoute("/account/orders/")({ component: MyOrders });
const PAGE = 10;

function MyOrders() {
  const [page, setPage] = useState(0);
  // RLS limits rows to orders placed while signed in to this account.
  const q = useQuery({
    queryKey: ["my-orders", page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("orders")
        .select(
          "id, order_number, created_at, total, status, payment_status, order_items(quantity)",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });
  if (q.isLoading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading your orders…
      </p>
    );
  if (q.isError) return <FormAlert>Could not load your orders. Please refresh the page.</FormAlert>;
  if (!q.data?.rows.length)
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm">
        <p>No orders on this account yet.</p>
        <p className="mt-1 text-muted-foreground">
          Orders placed as a guest can be looked up on{" "}
          <Link to="/track-order" className="text-primary underline">
            Track Order
          </Link>
          .
        </p>
        <Link
          to="/shop"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Start shopping
        </Link>
      </div>
    );
  const pages = Math.ceil(q.data.count / PAGE);
  return (
    <div className="space-y-3">
      {q.data.rows.map((o) => (
        <Link
          key={o.id}
          to="/account/orders/$id"
          params={{ id: o.id }}
          className="block rounded-lg border border-border bg-card p-4 hover:border-primary"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">#{o.order_number}</p>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs">
              {ORDER_STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(o.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · {o.order_items.reduce((s, i) => s + i.quantity, 0)} item(s) · {formatTaka(o.total)} ·{" "}
            {PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status}
          </p>
        </Link>
      ))}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {pages}
          </span>
          <button
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
