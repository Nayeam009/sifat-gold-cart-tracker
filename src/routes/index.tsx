import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gem, Headphones, Star, Truck, Wallet, MapPin, Phone, Clock, MessageCircle, Facebook, Quote } from "lucide-react";
import hero from "@/assets/hero-bride.jpg";
import bridal from "@/assets/bridal-banner.jpg";
import { BRAND, categories, occasions } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { SectionTitle } from "@/components/site/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { seo } from "@/lib/seo";
import { homeFaqs } from "@/lib/faqs";
import { bestsellersQuery, faqsQuery, socialLinksQuery, testimonialsQuery } from "@/lib/store-data";

export const Route = createFileRoute("/")({
  head: () => seo("Beauty for Your Special Moments", "Shop bridal flower sets, sarees, jewellery, makeup and bridal shoes. Cash on delivery across Bangladesh."),
  loader: async ({ context }) => {
    const safe = <T,>(o: { queryKey: readonly unknown[]; queryFn?: unknown }) => context.queryClient.ensureQueryData(o as never).then((d) => d as T).catch(() => undefined);
    const [best, reviews, faqs, social] = await Promise.all([
      safe<Awaited<ReturnType<typeof bestsellersQuery.queryFn & {}>>>(bestsellersQuery),
      safe<Awaited<ReturnType<typeof testimonialsQuery.queryFn & {}>>>(testimonialsQuery),
      safe<Awaited<ReturnType<typeof faqsQuery.queryFn & {}>>>(faqsQuery),
      safe<Awaited<ReturnType<typeof socialLinksQuery.queryFn & {}>>>(socialLinksQuery),
    ]);
    return { best, reviews, faqs, social };
  },
  component: Home,
});

const benefits = [
  { icon: Gem, t: "Quality-Focused Products", d: "Each item is chosen and checked by our team before it is sent." },
  { icon: Wallet, t: "Cash on Delivery", d: "Pay in cash when your order arrives at your door." },
  { icon: Truck, t: "Nationwide Delivery", d: "We deliver inside Saidpur and to the rest of Bangladesh." },
  { icon: Headphones, t: "Friendly Customer Support", d: `Call our hotline ${BRAND.hotline} for help choosing.` },
];

function Skeletons({ n, className }: { n: number; className: string }) {
  return <>{Array.from({ length: n }).map((_, i) => <div key={i} className={`animate-pulse rounded-lg bg-muted ${className}`} />)}</>;
}

function Home() {
  const init = Route.useLoaderData();
  const best = useQuery({ ...bestsellersQuery, initialData: init.best });
  const reviews = useQuery({ ...testimonialsQuery, initialData: init.reviews });
  const faqs = useQuery({ ...faqsQuery, initialData: init.faqs });
  const social = useQuery({ ...socialLinksQuery, initialData: init.social });
  const faqList = faqs.data && faqs.data.length > 0 ? faqs.data.map((f) => ({ q: f.question, a: f.answer })) : homeFaqs;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/40 to-background">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full border border-primary/20" />
        <div aria-hidden className="pointer-events-none absolute -left-10 top-24 h-44 w-44 rounded-full border border-primary/15" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="order-2 text-center md:order-1 md:text-left">
            <p className="eyebrow">Bridal • Beauty • Fashion</p>
            <div className="mx-auto mt-4 h-px w-16 bg-primary md:mx-0" />
            <h1 className="mt-5 text-4xl leading-[1.08] text-espresso sm:text-5xl lg:text-6xl">
              Your Special Moments Deserve Something <em className="text-accent">Beautiful</em>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-foreground/75 md:mx-0">Discover bridal essentials, beauty favourites, elegant fashion, and finishing touches for every unforgettable occasion.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-7 py-3 text-sm text-primary-foreground hover:opacity-90">Shop Now <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/occasion/$slug" params={{ slug: "wedding" }} className="inline-flex items-center justify-center gap-2 rounded-md border border-accent px-7 py-3 text-sm text-accent hover:bg-accent hover:text-accent-foreground">Explore Bridal Collection</Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative mx-auto max-w-md md:max-w-none">
              <div aria-hidden className="absolute -inset-3 rounded-t-full border border-primary/40" />
              <img src={hero} alt="Bride in red and gold bridal saree with floral jewellery" width={1600} height={912} className="relative aspect-[4/5] w-full rounded-t-full object-cover object-right shadow-soft" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle eyebrow="Shop by category" title="Our Collections" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="group overflow-hidden rounded-lg border border-border bg-card shadow-soft">
              <div className="aspect-square overflow-hidden"><img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="flex items-center justify-between px-3 py-3 text-xs font-medium">{c.name} <ArrowRight className="h-3 w-3 text-primary" /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured bridal */}
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="eyebrow">Featured collection</p>
            <h2 className="mt-3 text-4xl md:text-5xl">The Bridal Edit</h2>
            <p className="mt-2 text-lg">Complete Your Dream Look</p>
            <ul className="mt-5 grid grid-cols-2 gap-2 text-sm text-foreground/80">
              {["Bridal accessories", "Floral sets", "Gold-tone jewellery", "Bridal footwear"].map((x) => <li key={x} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{x}</li>)}
            </ul>
            <Link to="/occasion/$slug" params={{ slug: "wedding" }} className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground hover:opacity-90">Explore Bridal Collection <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <img src={bridal} alt="Bridal flower set, jewellery and heels" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover shadow-soft" />
        </div>
      </section>

      {/* Bestsellers */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle eyebrow="Best sellers" title="Most Loved Products" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {best.isPending && <Skeletons n={6} className="aspect-[3/4]" />}
          {best.data?.map((p) => <ProductCard key={p.slug} p={p} showStock variants={p.variants} />)}
        </div>
        {best.isError && <p className="text-center text-sm text-muted-foreground">We couldn't load products right now. <button onClick={() => best.refetch()} className="text-primary underline">Try again</button></p>}
        {best.data?.length === 0 && <p className="text-center text-sm text-muted-foreground">New favourites are coming soon. <Link to="/shop" className="text-primary underline">Browse the shop</Link></p>}
        <div className="mt-8 text-center"><Link to="/shop" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">View all products <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      {/* Why us */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <SectionTitle eyebrow="Our promise" title="Why Shop With SifatMart?" />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {benefits.map(({ icon: I, t, d }) => (
              <div key={t} className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-card text-primary"><I className="h-6 w-6" /></div>
                <p className="mt-3 text-sm font-semibold">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle eyebrow="Shop by occasion" title="For Every Special Occasion" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {occasions.map((o) => (
            <Link key={o.slug} to="/occasion/$slug" params={{ slug: o.slug }} className="group overflow-hidden rounded-lg border border-border bg-card text-center shadow-soft">
              <div className="aspect-[4/3] overflow-hidden"><img src={o.image} alt={o.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="py-4"><p className="font-display text-xl">{o.name}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">Shop Now <ArrowRight className="h-3 w-3" /></p></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <SectionTitle eyebrow="Our customers" title="What They Say" />
        {reviews.isPending ? (
          <div className="grid gap-6 md:grid-cols-3"><Skeletons n={3} className="h-40" /></div>
        ) : reviews.data && reviews.data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.data.map((r) => (
              <figure key={r.id} className="rounded-lg border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-accent font-display text-lg text-accent-foreground">{r.customer_name[0]}</div>
                  <div><p className="text-sm font-semibold">{r.customer_name}</p><div className="flex" aria-label={`${r.rating} out of 5`}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-star text-star" />)}</div></div>
                </div>
                <blockquote className="mt-4 text-sm text-foreground/80">“{r.body}”</blockquote>
              </figure>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-lg border border-dashed border-primary/40 bg-card p-8 text-center">
            <Quote className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-display text-xl">Reviews coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">We'll share real words from our brides and customers here once they're approved.</p>
          </div>
        )}
      </section>

      {/* FAQ + contact */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-8">
          <h2 className="text-2xl">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground">Ordering, payment, delivery and returns.</p>
          <Accordion type="single" collapsible className="mt-4">
            {faqList.map((f) => (
              <AccordionItem key={f.q} value={f.q}><AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
          <Link to="/faq" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">All FAQs <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-8">
          <h2 className="text-2xl">Need Help Choosing?</h2>
          <p className="text-sm text-muted-foreground">Our team is happy to help.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`tel:${BRAND.hotline}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground"><Phone className="h-4 w-4" /> Call {BRAND.hotline}</a>
            {social.data?.whatsapp && <a href={social.data.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs text-accent-foreground"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
            {social.data?.facebook && <a href={social.data.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2 text-xs text-espresso-foreground"><Facebook className="h-4 w-4" /> Facebook</a>}
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="h-4 w-4 text-primary" /> SifatMart, {BRAND.location}</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 text-primary" /> <a href={`tel:${BRAND.hotline}`} className="hover:text-primary">{BRAND.hotline}</a></li>
            <li className="flex gap-3"><Clock className="h-4 w-4 text-primary" /> {BRAND.hours}</li>
          </ul>
        </div>
      </section>
    </>
  );
}
