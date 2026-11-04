CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON public.products USING gin (name extensions.gin_trgm_ops);

CREATE TABLE public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- no policies: only service_role / security-definer functions may touch it

CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_start timestamptz; v_hits integer;
BEGIN
  v_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.rate_limits(key, window_start, hits) VALUES (p_key, v_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET hits = public.rate_limits.hits + 1
  RETURNING hits INTO v_hits;
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  RETURN v_hits <= p_max;
END $$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;