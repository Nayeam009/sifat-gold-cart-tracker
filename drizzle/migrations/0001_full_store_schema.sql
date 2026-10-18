-- Money: all amounts are INTEGER whole Taka (BDT). The storefront prices in whole Taka; no fractional paisa is used.
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text CHECK (char_length(full_name) <= 100),
  phone text CHECK (phone IS NULL OR phone ~ '^01[3-9][0-9]{8}$'),
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, left(NEW.raw_user_meta_data->>'full_name', 100))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home' CHECK (char_length(label) <= 40),
  recipient_name text NOT NULL CHECK (char_length(recipient_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^01[3-9][0-9]{8}$'),
  address_line text NOT NULL CHECK (char_length(address_line) BETWEEN 5 AND 300),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 80),
  zone text NOT NULL DEFAULT 'outside' CHECK (zone IN ('inside','outside')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_addresses_user_idx ON public.customer_addresses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own addresses select" ON public.customer_addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own addresses insert" ON public.customer_addresses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own addresses update" ON public.customer_addresses FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own addresses delete" ON public.customer_addresses FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER addresses_touch BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name text NOT NULL,
  group_name text NOT NULL DEFAULT 'Bridal' CHECK (group_name IN ('Bridal','Beauty','Fashion')),
  blurb text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  sku text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
  short_description text,
  description text,
  price integer NOT NULL CHECK (price >= 0),
  compare_at_price integer CHECK (compare_at_price IS NULL OR compare_at_price > price),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  occasions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_published_idx ON public.products(is_published, is_featured);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_images_product_idx ON public.product_images(product_id, sort_order);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  price integer CHECK (price IS NULL OR price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_idx ON public.product_variants(product_id);

CREATE TABLE public.homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, subtitle text, image_url text, link_url text,
  sort_order int NOT NULL DEFAULT 0, is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL, location text, body text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  sort_order int NOT NULL DEFAULT 0, is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL, answer text NOT NULL, topic text,
  sort_order int NOT NULL DEFAULT 0, is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.site_settings (
  key text PRIMARY KEY CHECK (key ~ '^[a-z0-9_]+$'),
  value jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{3,30}$'),
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  min_subtotal integer NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_discount integer CHECK (max_discount IS NULL OR max_discount > 0),
  starts_at timestamptz, expires_at timestamptz,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

GRANT SELECT ON public.categories, public.products, public.product_images, public.product_variants,
  public.homepage_banners, public.testimonials, public.faqs, public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.products, public.product_images, public.product_variants,
  public.homepage_banners, public.testimonials, public.faqs, public.site_settings, public.coupons TO authenticated;
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.categories, public.products, public.product_images, public.product_variants,
  public.homepage_banners, public.testimonials, public.faqs, public.site_settings, public.coupons TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published" ON public.categories FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published" ON public.products FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published" ON public.product_images FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published" ON public.product_variants FOR SELECT TO anon, authenticated
  USING ((is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published)) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published" ON public.homepage_banners FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published" ON public.faqs FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read public settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (is_public OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read coupons" ON public.coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['categories','products','product_images','product_variants','homepage_banners','testimonials','faqs','site_settings','coupons'] LOOP
    EXECUTE format('CREATE POLICY "Admins insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins update" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['categories','products','product_variants','homepage_banners','testimonials','faqs','site_settings','coupons'] LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t || '_touch', t);
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD COLUMN user_id uuid,
  ADD COLUMN discount integer NOT NULL DEFAULT 0 CHECK (discount >= 0),
  ADD COLUMN coupon_code text,
  ADD COLUMN delivery_zone text CHECK (delivery_zone IN ('inside','outside')),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','returned')) NOT VALID;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_check CHECK (payment_method IN ('cod')) NOT VALID;
ALTER TABLE public.orders ADD CONSTRAINT orders_amounts_check CHECK (subtotal >= 0 AND delivery_fee >= 0 AND total = subtotal + delivery_fee - discount) NOT VALID;
CREATE INDEX orders_user_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX orders_phone_idx ON public.orders(phone);
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.order_items
  ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN sku text,
  ADD COLUMN variant_name text,
  ADD COLUMN line_total integer,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
UPDATE public.order_items SET line_total = unit_price * quantity WHERE line_total IS NULL;
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

CREATE OR REPLACE FUNCTION public.prevent_order_item_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Order items are immutable snapshots'; END $$;
CREATE TRIGGER order_items_immutable BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.prevent_order_item_change();

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.orders, public.order_items TO service_role;
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Customers read own order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE OR REPLACE FUNCTION public.place_order(p_customer jsonb, p_items jsonb, p_user_id uuid DEFAULT NULL, p_coupon text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_zone text := p_customer->>'zone';
  v_fees jsonb;
  v_fee int;
  v_subtotal int := 0;
  v_discount int := 0;
  v_item jsonb;
  v_qty int;
  v_p public.products%ROWTYPE;
  v_v public.product_variants%ROWTYPE;
  v_price int;
  v_c public.coupons%ROWTYPE;
  v_order_id uuid;
  v_number text;
  v_lines jsonb := '[]'::jsonb;
  v_line jsonb;
BEGIN
  IF v_zone IS NULL OR v_zone NOT IN ('inside','outside') THEN RAISE EXCEPTION 'INVALID_ZONE'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'INVALID_ITEMS'; END IF;

  SELECT value INTO v_fees FROM public.site_settings WHERE key = 'delivery_fees';
  v_fee := COALESCE((v_fees->>v_zone)::int, CASE WHEN v_zone = 'inside' THEN 60 ELSE 120 END);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'qty')::int;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 20 THEN RAISE EXCEPTION 'INVALID_QTY'; END IF;
    SELECT * INTO v_p FROM public.products WHERE slug = v_item->>'slug' AND is_published FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE:%', v_item->>'slug'; END IF;
    IF v_item->>'variant_sku' IS NOT NULL THEN
      SELECT * INTO v_v FROM public.product_variants WHERE sku = v_item->>'variant_sku' AND product_id = v_p.id AND is_active FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'VARIANT_UNAVAILABLE:%', v_item->>'variant_sku'; END IF;
      IF v_v.stock_quantity < v_qty THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', v_p.name; END IF;
      UPDATE public.product_variants SET stock_quantity = stock_quantity - v_qty WHERE id = v_v.id;
      v_price := COALESCE(v_v.price, v_p.price);
      v_line := jsonb_build_object('product_id', v_p.id, 'variant_id', v_v.id, 'sku', v_v.sku, 'variant_name', v_v.name,
        'slug', v_p.slug, 'name', v_p.name, 'price', v_price, 'qty', v_qty);
    ELSE
      IF v_p.stock_quantity < v_qty THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', v_p.name; END IF;
      UPDATE public.products SET stock_quantity = stock_quantity - v_qty WHERE id = v_p.id;
      v_price := v_p.price;
      v_line := jsonb_build_object('product_id', v_p.id, 'variant_id', NULL, 'sku', v_p.sku, 'variant_name', NULL,
        'slug', v_p.slug, 'name', v_p.name, 'price', v_price, 'qty', v_qty);
    END IF;
    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_array(v_line);
  END LOOP;

  IF p_coupon IS NOT NULL AND p_coupon <> '' THEN
    SELECT * INTO v_c FROM public.coupons WHERE code = upper(p_coupon) AND is_active FOR UPDATE;
    IF NOT FOUND OR (v_c.starts_at IS NOT NULL AND v_c.starts_at > now()) OR (v_c.expires_at IS NOT NULL AND v_c.expires_at < now())
       OR (v_c.usage_limit IS NOT NULL AND v_c.times_used >= v_c.usage_limit) OR v_subtotal < v_c.min_subtotal THEN
      RAISE EXCEPTION 'INVALID_COUPON'; END IF;
    v_discount := CASE WHEN v_c.discount_type = 'percent' THEN (v_subtotal * v_c.discount_value) / 100 ELSE v_c.discount_value END;
    IF v_c.max_discount IS NOT NULL THEN v_discount := LEAST(v_discount, v_c.max_discount); END IF;
    v_discount := LEAST(v_discount, v_subtotal);
    UPDATE public.coupons SET times_used = times_used + 1 WHERE id = v_c.id;
  END IF;

  v_number := 'SM' || to_char(now(), 'YYMMDD') || lpad((floor(random() * 1000000))::int::text, 6, '0');
  INSERT INTO public.orders (order_number, user_id, customer_name, phone, email, address, city, area, delivery_zone, notes,
    subtotal, delivery_fee, discount, total, coupon_code, payment_method)
  VALUES (v_number, p_user_id, p_customer->>'customer_name', p_customer->>'phone', NULLIF(p_customer->>'email',''),
    p_customer->>'address', p_customer->>'city', CASE WHEN v_zone='inside' THEN 'Inside Saidpur' ELSE 'Outside Saidpur' END,
    v_zone, NULLIF(p_customer->>'notes',''), v_subtotal, v_fee, v_discount, v_subtotal + v_fee - v_discount,
    CASE WHEN v_discount > 0 THEN upper(p_coupon) END, 'cod')
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, variant_id, sku, product_slug, product_name, variant_name, unit_price, quantity, line_total)
  SELECT v_order_id, (l->>'product_id')::uuid, (l->>'variant_id')::uuid, l->>'sku', l->>'slug', l->>'name', l->>'variant_name',
    (l->>'price')::int, (l->>'qty')::int, (l->>'price')::int * (l->>'qty')::int
  FROM jsonb_array_elements(v_lines) l;

  RETURN jsonb_build_object('order_number', v_number, 'subtotal', v_subtotal, 'delivery_fee', v_fee, 'discount', v_discount, 'total', v_subtotal + v_fee - v_discount);
END $$;
REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;