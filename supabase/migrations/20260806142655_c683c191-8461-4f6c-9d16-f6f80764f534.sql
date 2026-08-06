-- Create ufc_fighter_overrides table
CREATE TABLE IF NOT EXISTS public.ufc_fighter_overrides (
    fighter_name TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ufc_fighter_overrides TO authenticated;
GRANT ALL ON public.ufc_fighter_overrides TO service_role;

-- Enable RLS
ALTER TABLE public.ufc_fighter_overrides ENABLE ROW LEVEL SECURITY;

-- Policies for ufc_fighter_overrides
CREATE POLICY "Allow authenticated users to manage overrides" 
ON public.ufc_fighter_overrides 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Storage policies for site_assets (SQL on storage.objects is allowed)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site_assets');

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site_assets');

CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site_assets');

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site_assets');
