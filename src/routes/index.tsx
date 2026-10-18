import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Headphones, Play, Star, Tag, Truck, MapPin, Phone, Clock, MessageCircle, Facebook } from "lucide-react";
import hero from "@/assets/hero-bride.jpg";
import bridal from "@/assets/bridal-banner.jpg";
import makeup from "@/assets/p-makeup.jpg";
import { BRAND, categories, occasions, products } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { SectionTitle } from "@/components/site/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { seo } from "@/lib/seo";
import { homeFaqs } from "@/lib/faqs";

export const Route = createFileRoute("/")({
  head: () => seo("Beauty for Your Special Moments", "Shop bridal flower sets, sarees, jewellery, makeup and bridal shoes. Cash on delivery across Bangladesh."),
  component: Home,
});


const reviews = [
  { name: "Farhana Akter", text: "Amazing collection and excellent customer service! My bridal set was more beautiful than I expected." },
  { name: "Nusrat Jahan", text: "High quality products and fast delivery. I'm so happy with my purchase. Highly recommended!" },
  { name: "Tanjima Islam", text: "The makeup and skincare products are original and work really well. Will definitely shop again!" },
];

function Home() {
  const best = products.filter((p) => p.bestSeller).slice(0, 5);
  return (
    <>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Bride in red and gold saree" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="max-w-xl">
            <p className="eyebrow">Bridal · Beauty · Fashion</p>
            <h1 className="mt-5 text-5xl leading-[1.05] text-espresso md:text-6xl">
              Your Special Moments Deserve Something <em className="text-primary">Beautiful</em>
            </h1>
            <p className="mt-5 max-w-md text-foreground/75">Discover bridal essentials, beauty favourites, elegant fashion and finishing touches for every unforgettable occasion.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground hover:opacity-90">Shop Now <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/about" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm hover:border-primary"><span className="grid h-6 w-6 place-items-center rounded-full bg-espresso text-espresso-foreground"><Play className="h-3 w-3" /></span> Discover Our Story</Link>
            </div>
          </div>
        </div>
      </section>

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

      <section className="relative overflow-hidden bg-secondary">
        <img src={bridal} alt="Bridal collection" loading="lazy" className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover md:block" />
        <div className="absolute inset-0 hidden bg-hero-fade md:block" />
        <div className="relative mx-auto max-w-7xl px-4 py-20">
          <div className="max-w-md">
            <p className="eyebrow">Special collection</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Bridal Collection</h2>
            <p className="mt-2 text-lg">Complete Your Dream Look</p>
            <p className="mt-4 text-sm text-muted-foreground">From floral sets to jewellery, sarees to accessories — find everything you need for your perfect day in one place.</p>
            <Link to="/occasion/$slug" params={{ slug: "wedding" }} className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground hover:opacity-90">Explore Bridal Collection <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle eyebrow="Best sellers" title="Most Loved Products" sub="Loved by thousands of happy customers" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {best.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      <section className="relative overflow-hidden bg-secondary">
        <img src={makeup} alt="" loading="lazy" className="absolute inset-y-0 left-0 hidden h-full w-1/4 object-cover opacity-90 lg:block" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:pl-[30%]">
          <p className="eyebrow">Why choose <span className="font-display text-2xl normal-case tracking-normal text-foreground">SifatMart?</span></p>
          <p className="mt-1 font-medium">Your Trusted Partner for Beauty, Fashion & More</p>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: BadgeCheck, t: "100% Authentic Products", d: "Guaranteed genuine and high quality." },
              { icon: Truck, t: "Cash on Delivery Across Bangladesh", d: "Shop with confidence, pay on delivery." },
              { icon: Tag, t: "Affordable Prices", d: "Premium quality at the best value." },
              { icon: Headphones, t: "Fast & Friendly Support", d: "We're here to help, always." },
            ].map(({ icon: I, t, d }) => (
              <div key={t} className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-card text-primary"><I className="h-6 w-6" /></div>
                <p className="mt-3 text-sm font-semibold">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle title="For Every Special Occasion" sub="Perfect Looks for Life's Most Beautiful Moments" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {occasions.map((o) => (
            <Link key={o.slug} to="/occasion/$slug" params={{ slug: o.slug }} className="group overflow-hidden rounded-lg border border-border bg-card text-center shadow-soft">
              <div className="aspect-[4/3] overflow-hidden"><img src={o.image} alt={o.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="py-4"><p className="font-display text-xl">{o.name}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">Shop Now <ArrowRight className="h-3 w-3" /></p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <SectionTitle eyebrow="Our happy customers" title="What They Say" />
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-accent font-display text-lg text-accent-foreground">{r.name[0]}</div>
                <div><p className="text-sm font-semibold">{r.name}</p><div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-star text-star" />)}</div></div>
              </div>
              <blockquote className="mt-4 text-sm text-foreground/80">“{r.text}”</blockquote>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="text-2xl">Frequently Asked Questions</h3>
          <p className="text-sm text-muted-foreground">Find quick answers to common questions.</p>
          <Accordion type="single" collapsible className="mt-4">
            {homeFaqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}><AccordionTrigger className="text-sm">{f.q}</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-8">
          <h3 className="text-2xl">Need Help Choosing?</h3>
          <p className="text-sm text-muted-foreground">Our team is here to assist you.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground"><MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp</a>
            <a href={BRAND.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2 text-xs text-espresso-foreground"><Facebook className="h-4 w-4" /> Follow us on Facebook</a>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="h-4 w-4 text-primary" /> {BRAND.location}</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 text-primary" /> {BRAND.hotline}</li>
            <li className="flex gap-3"><Clock className="h-4 w-4 text-primary" /> {BRAND.hours}</li>
          </ul>
        </div>
      </section>
    </>
  );
}
