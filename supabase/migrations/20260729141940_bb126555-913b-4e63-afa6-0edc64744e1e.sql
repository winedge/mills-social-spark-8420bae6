
-- 1. menu_categories (hierarchical)
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);

GRANT SELECT ON public.menu_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view menu categories" ON public.menu_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage menu categories" ON public.menu_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_menu_categories_updated
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Link menu_items to categories
ALTER TABLE public.menu_items
  ADD COLUMN category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL;

-- Backfill: create a top-level category per distinct existing category text
INSERT INTO public.menu_categories (name, slug, sort_order)
SELECT DISTINCT category,
       lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')),
       0
FROM public.menu_items
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT DO NOTHING;

UPDATE public.menu_items mi
SET category_id = mc.id
FROM public.menu_categories mc
WHERE mc.parent_id IS NULL
  AND lower(regexp_replace(mi.category, '[^a-zA-Z0-9]+', '-', 'g')) = mc.slug
  AND mi.category_id IS NULL;

-- 3. page_views for analytics
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  session_id text NOT NULL,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a page view" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read page views" ON public.page_views
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_session ON public.page_views (session_id);
