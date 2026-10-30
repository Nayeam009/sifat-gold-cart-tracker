ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name text, ADD COLUMN IF NOT EXISTS tracking_code text, ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price integer CHECK (cost_price IS NULL OR cost_price >= 0);
CREATE INDEX IF NOT EXISTS orders_phone_idx ON public.orders(phone);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders(status, created_at DESC);

CREATE TABLE public.order_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','received','completed')),
  kind text NOT NULL DEFAULT 'return' CHECK (kind IN ('return','exchange')),
  reason text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  refund_amount integer NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  refund_method text NOT NULL DEFAULT 'cash' CHECK (refund_method IN ('cash','store_credit','none')),
  restock boolean NOT NULL DEFAULT true,
  admin_note text,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_returns_order_idx ON public.order_returns(order_id);
CREATE INDEX order_returns_status_idx ON public.order_returns(status, created_at DESC);
GRANT SELECT ON public.order_returns TO authenticated;
GRANT ALL ON public.order_returns TO service_role;
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read returns" ON public.order_returns FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.store_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  amount integer NOT NULL CHECK (amount <> 0),
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  return_id uuid REFERENCES public.order_returns(id) ON DELETE SET NULL,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX store_credits_phone_idx ON public.store_credits(phone);
CREATE INDEX store_credits_order_idx ON public.store_credits(order_id);
CREATE INDEX store_credits_return_idx ON public.store_credits(return_id);
GRANT SELECT ON public.store_credits TO authenticated;
GRANT ALL ON public.store_credits TO service_role;
ALTER TABLE public.store_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read credits" ON public.store_credits FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  admin_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_notes_phone_idx ON public.customer_notes(phone);
GRANT SELECT, INSERT, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notes" ON public.customer_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins add notes" ON public.customer_notes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete notes" ON public.customer_notes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.incomplete_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL UNIQUE,
  customer_name text,
  phone text NOT NULL,
  city text,
  cart jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal integer NOT NULL DEFAULT 0,
  recovered boolean NOT NULL DEFAULT false,
  contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX incomplete_checkouts_created_idx ON public.incomplete_checkouts(created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.incomplete_checkouts TO authenticated;
GRANT ALL ON public.incomplete_checkouts TO service_role;
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read incomplete" ON public.incomplete_checkouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update incomplete" ON public.incomplete_checkouts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete incomplete" ON public.incomplete_checkouts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.record_incomplete_checkout(p_key text, p_name text, p_phone text, p_city text, p_cart jsonb, p_subtotal int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 16 AND 64 THEN RAISE EXCEPTION 'INVALID_KEY'; END IF;
  IF p_phone !~ '^01[3-9][0-9]{8}$' THEN RAISE EXCEPTION 'INVALID_PHONE'; END IF;
  IF jsonb_typeof(p_cart) <> 'array' OR jsonb_array_length(p_cart) > 50 OR length(p_cart::text) > 8000 THEN RAISE EXCEPTION 'INVALID_CART'; END IF;
  INSERT INTO public.incomplete_checkouts(session_key, customer_name, phone, city, cart, subtotal)
  VALUES (p_key, left(p_name,100), p_phone, left(p_city,60), p_cart, greatest(0, least(p_subtotal, 100000000)))
  ON CONFLICT (session_key) DO UPDATE SET customer_name = EXCLUDED.customer_name, phone = EXCLUDED.phone,
    city = EXCLUDED.city, cart = EXCLUDED.cart, subtotal = EXCLUDED.subtotal, updated_at = now()
    WHERE public.incomplete_checkouts.recovered = false;
END $$;
CREATE OR REPLACE FUNCTION public.complete_incomplete_checkout(p_key text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.incomplete_checkouts SET recovered = true, updated_at = now() WHERE session_key = p_key;
$$;
REVOKE ALL ON FUNCTION public.record_incomplete_checkout(text,text,text,text,jsonb,int) FROM public;
REVOKE ALL ON FUNCTION public.complete_incomplete_checkout(text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_incomplete_checkout(text,text,text,text,jsonb,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_incomplete_checkout(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.store_credit_balance(p_phone text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(auth.uid(),'admin') THEN coalesce(sum(amount),0)::int ELSE NULL END FROM public.store_credits WHERE phone = p_phone;
$$;
CREATE OR REPLACE FUNCTION public.admin_add_store_credit(p_phone text, p_amount int, p_reason text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bal int;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_amount = 0 OR abs(p_amount) > 10000000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF coalesce(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('credit:' || p_phone));
  SELECT coalesce(sum(amount),0) INTO v_bal FROM public.store_credits WHERE phone = p_phone;
  IF v_bal + p_amount < 0 THEN RAISE EXCEPTION 'CREDIT_BELOW_ZERO'; END IF;
  INSERT INTO public.store_credits(phone, amount, reason, admin_id) VALUES (p_phone, p_amount, left(p_reason,200), auth.uid());
  RETURN v_bal + p_amount;
END $$;

CREATE OR REPLACE FUNCTION public.admin_create_return(p_order_id uuid, p_kind text, p_reason text, p_items jsonb, p_refund int, p_method text, p_restock boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total int; v_prior int; v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT total INTO v_total FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF coalesce(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  SELECT coalesce(sum(refund_amount),0) INTO v_prior FROM public.order_returns WHERE order_id = p_order_id AND status <> 'rejected';
  IF p_refund < 0 OR p_refund + v_prior > v_total THEN RAISE EXCEPTION 'REFUND_TOO_HIGH'; END IF;
  IF jsonb_typeof(p_items) <> 'array' THEN RAISE EXCEPTION 'INVALID_ITEMS'; END IF;
  INSERT INTO public.order_returns(order_id, kind, reason, items, refund_amount, refund_method, restock, admin_id)
  VALUES (p_order_id, p_kind, left(p_reason,500), p_items, p_refund, p_method, p_restock, auth.uid()) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_return_transition(p_id uuid, p_to text, p_note text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.order_returns; it jsonb; oi public.order_items; v_qty int; v_phone text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT * INTO r FROM public.order_returns WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT ((r.status = 'requested' AND p_to IN ('approved','rejected'))
       OR (r.status = 'approved' AND p_to IN ('received','rejected'))
       OR (r.status = 'received' AND p_to = 'completed')) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;
  IF p_to = 'received' AND r.restock THEN
    FOR it IN SELECT * FROM jsonb_array_elements(r.items) LOOP
      SELECT * INTO oi FROM public.order_items WHERE id = (it->>'order_item_id')::uuid AND order_id = r.order_id;
      v_qty := least(coalesce((it->>'quantity')::int,0), coalesce(oi.quantity,0));
      IF oi.id IS NOT NULL AND oi.product_id IS NOT NULL AND v_qty > 0 THEN
        PERFORM public.admin_adjust_stock(oi.product_id, oi.variant_id, v_qty, 'returned', 'Return ' || left(r.id::text,8));
      END IF;
    END LOOP;
  END IF;
  IF p_to = 'completed' AND r.refund_method = 'store_credit' AND r.refund_amount > 0 THEN
    SELECT phone INTO v_phone FROM public.orders WHERE id = r.order_id;
    INSERT INTO public.store_credits(phone, amount, reason, order_id, return_id, admin_id)
    VALUES (v_phone, r.refund_amount, 'Return refund', r.order_id, r.id, auth.uid());
  END IF;
  UPDATE public.order_returns SET status = p_to, updated_at = now(),
    admin_note = CASE WHEN coalesce(trim(p_note),'') = '' THEN admin_note ELSE left(p_note,500) END WHERE id = p_id;
  RETURN p_to;
END $$;

REVOKE ALL ON FUNCTION public.store_credit_balance(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_add_store_credit(text,int,text) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_create_return(uuid,text,text,jsonb,int,text,boolean) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_return_transition(uuid,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.store_credit_balance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_store_credit(text,int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_return(uuid,text,text,jsonb,int,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_return_transition(uuid,text,text) TO authenticated;