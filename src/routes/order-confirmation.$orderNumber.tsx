import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { BRAND } from "@/lib/catalog";

export const Route = createFileRoute("/order-confirmation/$orderNumber")({
  head: () => ({ meta: [{ title: "Order Confirmed | SifatMart" }, { name: "description", content: "Thank you for your SifatMart order." }, { property: "og:title", content: "Order Confirmed | SifatMart" }, { property: "og:description", content: "Thank you for your SifatMart order." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Confirmation,
});

function Confirmation() {
  const { orderNumber } = Route.useParams();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
      <h1 className="mt-6 text-4xl">Thank you for your order!</h1>
      <p className="mt-3 text-muted-foreground">Your order number is</p>
      <p className="mt-1 font-display text-3xl text-accent">{orderNumber}</p>
      <p className="mt-4 text-sm text-muted-foreground">We'll call you on your mobile number to confirm. Please keep cash ready on delivery. Questions? Call {BRAND.hotline}.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/track-order" search={{ order: orderNumber }} className="rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground">Track Order</Link>
        <Link to="/shop" className="rounded-md border border-border px-6 py-3 text-sm">Continue Shopping</Link>
      </div>
    </div>
  );
}
