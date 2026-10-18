import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/auth";
import { catalogueQuery } from "@/lib/catalogue-data";
import { ProductCard } from "@/components/site/product-card";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () =>
    seo("My Wishlist", "Products you've saved at SifatMart.", { path: "/wishlist", noindex: true }),
  component: Wishlist,
});

function Wishlist() {
  const { wishlist } = useCart();
  const session = useSession();
  const q = useQuery(catalogueQuery);
  const list = (q.data ?? []).filter((p) => wishlist.includes(p.slug));
  return (
    <>
      <PageHeader eyebrow="Saved for later" title="My Wishlist" />
      <div className="mx-auto max-w-7xl px-4 py-12">
        {session.status === "signed_out" && wishlist.length > 0 && (
          <p className="mb-6 rounded-md bg-secondary px-4 py-3 text-sm">
            Saved on this device only.{" "}
            <Link to="/login" search={{ next: "/wishlist" }} className="text-primary underline">
              Sign in
            </Link>{" "}
            to keep your wishlist on every device.
          </p>
        )}
        {q.isLoading ? (
          <p role="status" className="text-center text-muted-foreground">
            Loading your wishlist…
          </p>
        ) : q.isError ? (
          <p role="alert" className="text-center text-destructive">
            Could not load products. Please refresh.
          </p>
        ) : list.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Your wishlist is empty.{" "}
            <Link to="/shop" className="text-primary underline">
              Start shopping
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.slug} p={p} showStock />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
