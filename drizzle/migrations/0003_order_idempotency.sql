ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uidx ON public.orders (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.place_order_once(p_customer jsonb, p_items jsonb, p_user_id uuid, p_coupon text, p_idem text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_existing public.orders%ROWTYPE; v_res jsonb;
BEGIN
  IF p_idem IS NULL OR length(p_idem) < 16 OR length(p_idem) > 64 THEN RAISE EXCEPTION 'INVALID_ITEMS'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_idem));
  SELECT * INTO v_existing FROM public.orders WHERE idempotency_key = p_idem;
  IF FOUND THEN
    RETURN jsonb_build_object('order_number', v_existing.order_number, 'subtotal', v_existing.subtotal,
      'delivery_fee', v_existing.delivery_fee, 'discount', v_existing.discount, 'total', v_existing.total, 'duplicate', true);
  END IF;
  v_res := public.place_order(p_customer, p_items, p_user_id, p_coupon);
  UPDATE public.orders SET idempotency_key = p_idem WHERE order_number = v_res->>'order_number';
  RETURN v_res;
END $$;
REVOKE ALL ON FUNCTION public.place_order_once(jsonb, jsonb, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_once(jsonb, jsonb, uuid, text, text) TO service_role;