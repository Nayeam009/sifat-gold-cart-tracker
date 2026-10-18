import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, HandCoins, Phone, Truck } from "lucide-react";
import { seo } from "@/lib/seo";
import { PolicyText } from "@/components/site/policy-text";
import { Button } from "@/components/ui/button";
import bridal from "@/assets/bridal-banner.webp";
import saree from "@/assets/p-saree.webp";
import jewellery from "@/assets/p-jewellery.webp";
import flowers from "@/assets/p-flowers.webp";

export const Route = createFileRoute("/about")({
  head: () =>
    seo(
      "About Us",
      "The story behind SifatMart, a bridal, beauty and fashion shop from Saidpur, Bangladesh.",
      { path: "/about" },
    ),
  component: AboutPage,
});

const GALLERY = [
  { src: bridal, alt: "Bride in a red and gold bridal look", area: "col-start-2 row-start-1 row-end-3" },
  { src: saree, alt: "Folded festive saree", area: "col-start-1 row-start-2 row-end-4" },
  { src: jewellery, alt: "Gold bridal jewellery set", area: "col-start-1 row-start-4 row-end-6" },
  { src: flowers, alt: "Bridal flower set", area: "col-start-2 row-start-3 row-end-5" },
];

const VALUES = [
  { icon: BadgeCheck, title: "Checked by hand", text: "We check every product's quality before it reaches you." },
  { icon: HandCoins, title: "Fair prices", text: "Beautiful pieces for every budget, with clear pricing." },
  { icon: Truck, title: "Cash on Delivery", text: "Pay when your order arrives at your door." },
  { icon: Phone, title: "Friendly help", text: "Call us on 01997974394 whenever you need advice." },
];

function AboutPage() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 py-14 md:grid-cols-2 md:px-8 md:py-20">
        <div className="about-stagger">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary">Our Story</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-foreground md:text-5xl">
            Beauty for Your Special Moments
          </h1>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            <PolicyText field="about">
              <p>
                SifatMart was founded by <strong className="text-foreground">Rowsan Parvin</strong> in
                Saidpur, Nilphamari with one simple wish: that every woman in Bangladesh can find
                beautiful, authentic pieces for life's special moments — without the stress.
              </p>
              <p>
                From bridal flower sets and sarees to jewellery, makeup and shoes, we hand-pick every
                product and check its quality before it reaches you.
              </p>
            </PolicyText>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shop">Shop the collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 grid-rows-[40px_140px_40px_140px_40px] gap-4 sm:grid-rows-[50px_180px_50px_180px_50px]">
          {GALLERY.map((img, i) => (
            <div
              key={img.src}
              className={`about-cell relative overflow-hidden rounded-xl bg-muted shadow-soft ${img.area}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <img src={img.src} alt={img.alt} loading={i < 2 ? "eager" : "lazy"} decoding="async" className="size-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <h2 className="text-center font-display text-3xl text-foreground md:text-4xl">What we believe</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-border bg-card p-6 text-center">
                <Icon className="mx-auto size-8 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Proudly based in Saidpur, Nilphamari, Bangladesh
          </p>
        </div>
      </section>
    </>
  );
}
