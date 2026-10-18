CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_slug text NOT NULL CHECK (length(product_slug) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wishlist read" ON public.wishlist_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own wishlist insert" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own wishlist delete" ON public.wishlist_items FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX wishlist_items_user_idx ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders(user_id, created_at DESC);