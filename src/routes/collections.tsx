import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { categories, occasions } from "@/lib/catalog";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/collections")({
  head: () =>
    seo(
      "Collections",
      "Explore SifatMart collections by category and by occasion — wedding, Gaye Holud, reception and engagement.",
      { path: "/collections" },
    ),
  component: Collections,
});

function Tile({
  to,
  params,
  image,
  name,
  blurb,
}: {
  to: "/category/$slug" | "/occasion/$slug";
  params: { slug: string };
  image: string;
  name: string;
  blurb: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      className="group overflow-hidden rounded-lg border border-border bg-card shadow-soft"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <h3 className="text-2xl">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
          Shop now <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function Collections() {
  return (
    <>
      <PageHeader eyebrow="Curated for you" title="Our Collections" />
      <div className="mx-auto max-w-7xl px-4 py-14">
        <SectionTitle title="By Category" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Tile key={c.slug} to="/category/$slug" params={{ slug: c.slug }} {...c} />
          ))}
        </div>
        <div className="mt-20">
          <SectionTitle title="By Occasion" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {occasions.map((o) => (
            <Tile key={o.slug} to="/occasion/$slug" params={{ slug: o.slug }} {...o} />
          ))}
        </div>
      </div>
    </>
  );
}
