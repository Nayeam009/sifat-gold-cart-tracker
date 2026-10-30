ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_consignment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_dispatched_at timestamptz;

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

  -- Free delivery when the goods subtotal (before coupon) reaches the configured threshold.
  IF COALESCE(v_fees->>'free_over','') ~ '^[0-9]{1,7}$' AND (v_fees->>'free_over')::int > 0
     AND v_subtotal >= (v_fees->>'free_over')::int THEN v_fee := 0; END IF;

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