CREATE TABLE public.job_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    department text,
    location text DEFAULT 'Tempe, AZ',
    type text DEFAULT 'Full-time',
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_listings TO authenticated;
GRANT SELECT ON public.job_listings TO anon;
GRANT ALL ON public.job_listings TO service_role;

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs" ON public.job_listings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage jobs" ON public.job_listings
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.job_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES public.job_listings(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    resume_url text,
    cover_letter text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

GRANT INSERT ON public.job_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.job_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage applications" ON public.job_applications
    USING (public.has_role(auth.uid(), 'admin'));