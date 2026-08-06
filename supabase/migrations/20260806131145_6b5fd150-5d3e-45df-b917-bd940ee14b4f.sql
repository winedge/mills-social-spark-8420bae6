CREATE TABLE public.marquee_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.marquee_images TO authenticated;
GRANT SELECT ON public.marquee_images TO anon;
GRANT ALL ON public.marquee_images TO service_role;

ALTER TABLE public.marquee_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.marquee_images FOR SELECT TO public USING (true);
CREATE POLICY "Allow service role all" ON public.marquee_images FOR ALL TO service_role USING (true);
