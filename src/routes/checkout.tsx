import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { formatTaka, type DeliveryZone } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { catalogueQuery } from "@/lib/catalogue-data";
import { newIdempotencyKey, normalizeBdPhone, reviewCart } from "@/lib/checkout";
import { BD_DISTRICTS } from "@/lib/bd-districts";
import { placeOrder, previewCoupon } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  head: () => seo("Checkout", "Complete your SifatMart order with Cash on Delivery.", { path: "/checkout", noindex: true }),
  component: Checkout,
});

const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive";

const feesQuery = {
  queryKey: ["delivery-fees"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "delivery_fees").maybeSingle();
    if (error || !data) throw new Error("Delivery charges unavailable");
    const v = data.value as { inside?: number; outside?: number };
    if (typeof v.inside !== "number" || typeof v.outside !== "number") throw new Error("Delivery charges unavailable");
    return { inside: v.inside, outside: v.outside };
  },
  staleTime: 60_000,
};

type Errors = Partial<Record<"name" | "phone" | "email" | "district" | "upazila" | "address", string>>;

function Checkout() {
  const { lines, clear } = useCart();
  const cat = useQuery(catalogueQuery);
  const fees = useQuery(feesQuery);
  const [zone, setZone] = useState<DeliveryZone>("outside");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const submit = useServerFn(placeOrder);
  const checkCoupon = useServerFn(previewCoupon);
  // One key per cart attempt: repeated clicks/retries reuse it so the server never creates a duplicate order.
  const idem = useRef<string>("");
  const cartSig = JSON.stringify(lines);
  useEffect(() => { idem.current = newIdempotencyKey(); }, [cartSig]);

  const reviewed = cat.data ? reviewCart(lines, cat.data) : [];
  const subtotal = reviewed.reduce((s, r) => s + r.lineTotal, 0);
  useEffect(() => { setCoupon(null); }, [subtotal]);
  const delivery = fees.data?.[zone] ?? null;
  const discount = coupon?.discount ?? 0;
  const issues = reviewed.filter((r) => r.issue);

  const m = useMutation({
    mutationFn: submit,
    onSuccess: (order) => {
      sessionStorage.setItem(`sm-order-${order.order_number}`, JSON.stringify(order));
      clear();
      navigate({ to: "/order-confirmation/$orderNumber", params: { orderNumber: order.order_number } });
    },
    onError: (e) => {
      const msg = e instanceof Error && e.message && !/fetch|network/i.test(e.message) ? e.message.slice(0, 240) : "We couldn't reach the shop. Check your internet and try again — your cart is saved.";
      setFormError(msg);
      cat.refetch();
    },
  });

  const applyCoupon = async () => {
    setCouponMsg(null);
    const code = couponInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,30}$/.test(code)) { setCouponMsg("Enter a valid coupon code."); return; }
    try {
      const r = await checkCoupon({ data: { code, subtotal } });
      if (r.ok) { setCoupon({ code: r.code, discount: r.discount }); setCouponMsg(`Coupon applied: −${formatTaka(r.discount)}`); }
      else { setCoupon(null); setCouponMsg(r.message); }
    } catch { setCouponMsg("Couldn't check the coupon right now."); }
  };

  if (lines.length === 0 && !m.isPending && !m.isSuccess)
    return <div className="py-24 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/shop" className="mt-4 inline-block text-primary underline">Go to shop</Link></div>;

  if (cat.isPending || fees.isPending) return <p className="py-24 text-center text-muted-foreground">Preparing your checkout…</p>;
  if (cat.isError || fees.isError)
    return <div className="py-24 text-center"><p className="text-destructive">We couldn't load checkout right now. Your cart is saved.</p><button onClick={() => { cat.refetch(); fees.refetch(); }} className="mt-4 rounded-md border border-border px-5 py-2 text-sm">Try again</button></div>;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (m.isPending) return;
    setFormError(null);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const errs: Errors = {};
    const name = get("name"), email = get("email"), district = get("district"), upazila = get("upazila"), address = get("address");
    const phone = normalizeBdPhone(get("phone"));
    if (name.length < 2) errs.name = "Please enter your full name.";
    if (!phone) errs.phone = "Enter a valid Bangladeshi mobile number, e.g. 01712345678.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email or leave it empty.";
    if (!BD_DISTRICTS.includes(district as never)) errs.district = "Please choose your district.";
    if (upazila.length < 2) errs.upazila = "Please enter your upazila or area.";
    if (address.length < 8) errs.address = "Please add house, road and nearby landmark.";
    setErrors(errs);
    if (Object.keys(errs).length) { setFormError("Please fix the highlighted fields."); return; }
    if (issues.length) { setFormError("Some items in your cart need attention — please update your cart."); return; }
    m.mutate({ data: {
      customer_name: name, phone: phone!, email, district, upazila, address, zone, notes: get("notes"),
      coupon: coupon?.code ?? "", payment_method: "cod", idempotency_key: idem.current,
      items: lines.map((l) => ({ slug: l.slug, qty: l.qty, ...(l.sku ? { variant_sku: l.sku } : {}) })),
    } });
  };

  const err = (k: keyof Errors) => errors[k] && <p id={`${k}-error`} className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <>
      <PageHeader title="Checkout" />
      <form noValidate className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_380px]" onSubmit={onSubmit}>
        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl">Delivery Details</h2>
          <p className="text-xs text-muted-foreground">No account needed. Fields marked * are required.</p>
          <div><label className="mb-1 block text-sm" htmlFor="name">Full name *</label><input id="name" name="name" maxLength={100} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} className={field} />{err("name")}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm" htmlFor="phone">Mobile number *</label><input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} className={field} />{err("phone")}</div>
            <div><label className="mb-1 block text-sm" htmlFor="email">Email (optional)</label><input id="email" name="email" type="email" maxLength={255} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} className={field} />{err("email")}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm" htmlFor="district">District *</label>
              <select id="district" name="district" defaultValue="" aria-invalid={!!errors.district} aria-describedby={errors.district ? "district-error" : undefined} className={field}
                onChange={(e) => setZone(e.target.value === "Nilphamari" ? zone : "outside")}>
                <option value="" disabled>Select district</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>{err("district")}</div>
            <div><label className="mb-1 block text-sm" htmlFor="upazila">Upazila / Area *</label><input id="upazila" name="upazila" maxLength={80} placeholder="e.g. Saidpur" autoComplete="address-level2" aria-invalid={!!errors.upazila} aria-describedby={errors.upazila ? "upazila-error" : undefined} className={field} />{err("upazila")}</div>
          </div>
          <div><label className="mb-1 block text-sm" htmlFor="address">Detailed address *</label><textarea id="address" name="address" maxLength={300} rows={3} placeholder="House, road, village/moholla, landmark" autoComplete="street-address" aria-invalid={!!errors.address} aria-describedby={errors.address ? "address-error" : undefined} className={field} />{err("address")}</div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Delivery area</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["inside", "outside"] as const).map((z) => (
                <label key={z} className={`flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm ${zone === z ? "border-primary bg-secondary" : "border-input"}`}>
                  <span><input type="radio" name="zone" checked={zone === z} onChange={() => setZone(z)} className="mr-2 accent-primary" />{z === "inside" ? "Inside Saidpur" : "Outside Saidpur"}</span>
                  <span>{formatTaka(fees.data[z])}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div><label className="mb-1 block text-sm" htmlFor="notes">Delivery notes (optional)</label><textarea id="notes" name="notes" maxLength={500} rows={2} placeholder="e.g. best time to call, event date" className={field} /></div>
          <div className="rounded-md border border-primary bg-secondary p-4 text-sm">
            <p className="font-medium">Payment: Cash on Delivery</p>
            <p className="text-muted-foreground">Pay in cash to the delivery person when your parcel arrives. Online payment isn't available yet.</p>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl">Your Order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {reviewed.map((r) => (
              <li key={r.key}>
                <div className="flex justify-between gap-3"><span>{r.product?.name ?? r.line.slug}{r.line.variant ? ` (${r.line.variant})` : ""} × {r.line.qty}</span><span>{formatTaka(r.lineTotal)}</span></div>
                {r.issue && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{r.issue}</p>}
              </li>
            ))}
          </ul>
          {issues.length > 0 && <Link to="/cart" className="mt-2 inline-block text-xs text-primary underline">Update cart</Link>}
          <div className="mt-4 flex gap-2">
            <input aria-label="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" className={field} />
            <button type="button" onClick={applyCoupon} className="rounded-md border border-border px-4 text-sm">Apply</button>
          </div>
          {couponMsg && <p className={`mt-1 text-xs ${coupon ? "text-primary" : "text-destructive"}`}>{couponMsg}</p>}
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatTaka(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{delivery != null ? formatTaka(delivery) : "—"}</span></div>
            {discount > 0 && <div className="flex justify-between text-primary"><span>Discount ({coupon?.code})</span><span>−{formatTaka(discount)}</span></div>}
            <div className="flex justify-between text-base font-semibold"><span>Payable on delivery</span><span className="text-primary">{formatTaka(subtotal + (delivery ?? 0) - discount)}</span></div>
            <p className="text-xs text-muted-foreground">Final prices and stock are confirmed when you place the order.</p>
          </div>
          {formError && <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
          <button type="submit" disabled={m.isPending || issues.length > 0} className="mt-6 w-full rounded-md bg-primary py-3 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {m.isPending ? "Placing order…" : "Confirm Order (Cash on Delivery)"}
          </button>
        </aside>
      </form>
    </>
  );
}
