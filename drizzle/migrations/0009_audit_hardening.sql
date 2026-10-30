CREATE OR REPLACE FUNCTION public.admin_create_return(p_order_id uuid, p_kind text, p_reason text, p_items jsonb, p_refund integer, p_method text, p_restock boolean)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_total int; v_prior int; v_id uuid; it jsonb; v_ordered int; v_already int; v_q int;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT total INTO v_total FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF coalesce(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  SELECT coalesce(sum(refund_amount),0) INTO v_prior FROM public.order_returns WHERE order_id = p_order_id AND status <> 'rejected';
  IF p_refund < 0 OR p_refund + v_prior > v_total THEN RAISE EXCEPTION 'REFUND_TOO_HIGH'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 100 THEN RAISE EXCEPTION 'INVALID_ITEMS'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_q := (it->>'quantity')::int;
    SELECT quantity INTO v_ordered FROM public.order_items WHERE id = (it->>'order_item_id')::uuid AND order_id = p_order_id;
    IF v_ordered IS NULL OR v_q IS NULL OR v_q <= 0 THEN RAISE EXCEPTION 'INVALID_ITEMS'; END IF;
    SELECT coalesce(sum((e->>'quantity')::int),0) INTO v_already
      FROM public.order_returns r, jsonb_array_elements(r.items) e
      WHERE r.order_id = p_order_id AND r.status <> 'rejected' AND e->>'order_item_id' = it->>'order_item_id';
    IF v_already + v_q > v_ordered THEN RAISE EXCEPTION 'RETURN_QTY_TOO_HIGH'; END IF;
  END LOOP;
  INSERT INTO public.order_returns(order_id, kind, reason, items, refund_amount, refund_method, restock, admin_id)
  VALUES (p_order_id, p_kind, left(p_reason,500), p_items, p_refund, p_method, p_restock, auth.uid()) RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

REVOKE EXECUTE ON FUNCTION public.log_order_change() FROM anon, authenticated, public;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (length(email) <= 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

DROP POLICY IF EXISTS "Public read product media" ON storage.objects;
CREATE POLICY "Admins list product media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'::app_role));