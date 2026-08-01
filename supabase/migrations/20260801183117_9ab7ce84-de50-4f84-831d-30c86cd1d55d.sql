CREATE TABLE IF NOT EXISTS public.sports_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sports_cache TO service_role;
ALTER TABLE public.sports_cache ENABLE ROW LEVEL SECURITY;