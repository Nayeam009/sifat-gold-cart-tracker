ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title text, ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('unpaid','collected','refunded'));

CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  item_label text NOT NULL,
  change integer NOT NULL,
  previous_qty integer NOT NULL,
  new_qty integer NOT NULL,
  reason text NOT NULL,
  note text,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_adjustments_product_idx ON public.stock_adjustments(product_id, created_at DESC);
GRANT SELECT ON public.stock_adjustments TO authenticated;
GRANT ALL ON public.stock_adjustments TO service_role;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read stock log" ON public.stock_adjustments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text,
  new_value text,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON public.order_status_history(order_id, created_at DESC);
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read order history" ON public.order_status_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_order_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, field, old_value, new_value, admin_id) VALUES (NEW.id,'status',OLD.status,NEW.status,auth.uid());
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    INSERT INTO public.order_status_history(order_id, field, old_value, new_value, admin_id) VALUES (NEW.id,'payment_status',OLD.payment_status,NEW.payment_status,auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_log_change AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_change();

-- Admins may only change workflow fields on orders, never prices or customer snapshot
CREATE OR REPLACE FUNCTION public.guard_order_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' AND (NEW.subtotal <> OLD.subtotal OR NEW.total <> OLD.total OR NEW.delivery_fee <> OLD.delivery_fee
     OR NEW.discount <> OLD.discount OR NEW.order_number <> OLD.order_number OR NEW.payment_method <> OLD.payment_method) THEN
    RAISE EXCEPTION 'Order amounts cannot be edited';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_guard_update BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

CREATE OR REPLACE FUNCTION public.admin_adjust_stock(p_product_id uuid, p_variant_id uuid, p_change int, p_reason text, p_note text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prev int; v_new int; v_label text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_change = 0 OR abs(p_change) > 100000 THEN RAISE EXCEPTION 'INVALID_CHANGE'; END IF;
  IF p_reason NOT IN ('restock','count_correction','damaged','returned','other') THEN RAISE EXCEPTION 'INVALID_REASON'; END IF;
  IF p_variant_id IS NOT NULL THEN
    SELECT v.stock_quantity, p.name || ' — ' || v.name INTO v_prev, v_label FROM public.product_variants v JOIN public.products p ON p.id=v.product_id
      WHERE v.id = p_variant_id AND v.product_id = p_product_id FOR UPDATE OF v;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    v_new := v_prev + p_change; IF v_new < 0 THEN RAISE EXCEPTION 'NEGATIVE_STOCK'; END IF;
    UPDATE public.product_variants SET stock_quantity = v_new WHERE id = p_variant_id;
  ELSE
    SELECT stock_quantity, name INTO v_prev, v_label FROM public.products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    v_new := v_prev + p_change; IF v_new < 0 THEN RAISE EXCEPTION 'NEGATIVE_STOCK'; END IF;
    UPDATE public.products SET stock_quantity = v_new WHERE id = p_product_id;
  END IF;
  INSERT INTO public.stock_adjustments(product_id, variant_id, item_label, change, previous_qty, new_qty, reason, note, admin_id)
    VALUES (p_product_id, p_variant_id, v_label, p_change, v_prev, v_new, p_reason, left(p_note,300), auth.uid());
  RETURN v_new;
END $$;
REVOKE ALL ON FUNCTION public.admin_adjust_stock(uuid,uuid,int,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_stock(uuid,uuid,int,text,text) TO authenticated;

CREATE POLICY "Public read product media" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "Admins upload product media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update product media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete product media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND public.has_role(auth.uid(),'admin'));