import { createFileRoute, Link } from "@tanstack/react-router";
import { products } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/product-card";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () => seo("My Wishlist", "Products you've saved at SifatMart."),
  component: Wishlist,
});

function Wishlist() {
  const { wishlist } = useCart();
  const list = products.filter((p) => wishlist.includes(p.slug));
  return (
    <>
      <PageHeader eyebrow="Saved for later" title="My Wishlist" />
      <div className="mx-auto max-w-7xl px-4 py-12">
        {list.length === 0 ? (
          <p className="text-center text-muted-foreground">Your wishlist is empty. <Link to="/shop" className="text-primary underline">Start shopping</Link></p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        )}
      </div>
    </>
  );
}
