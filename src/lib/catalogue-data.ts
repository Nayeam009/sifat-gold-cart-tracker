import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapRow, type CatalogueItem } from "@/lib/catalogue";

const SELECT =
  "id, slug, sku, name, short_description, description, price, compare_at_price, stock_quantity, created_at, categories(slug, name), product_images(image_url, alt_text, sort_order), product_variants(sku, name, price, stock_quantity, sort_order)";

export async function catalogueQueryFn(): Promise<CatalogueItem[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_published", true)
    .limit(500);
  if (error) throw new Error("Could not load products");
  return (data ?? []).map((r) => mapRow(r as never));
}

export const catalogueQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: catalogueQueryFn,
  staleTime: 60_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<CatalogueItem | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error("Could not load this product");
      return data ? mapRow(data as never) : null;
    },
    staleTime: 30_000,
  });

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("slug, name, blurb, group_name")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw new Error("Could not load categories");
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});
