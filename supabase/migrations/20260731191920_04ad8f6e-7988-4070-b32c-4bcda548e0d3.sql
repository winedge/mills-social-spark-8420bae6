CREATE TABLE public.ufc_streamed_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  date_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ufc_streamed_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ufc_streamed_events TO authenticated;
GRANT ALL ON public.ufc_streamed_events TO service_role;

ALTER TABLE public.ufc_streamed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streamed events"
  ON public.ufc_streamed_events FOR SELECT USING (true);

CREATE POLICY "Admins manage streamed events"
  ON public.ufc_streamed_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ufc_streamed_events_updated_at
  BEFORE UPDATE ON public.ufc_streamed_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();