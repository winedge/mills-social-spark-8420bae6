-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to manage overrides" ON public.ufc_fighter_overrides;
DROP POLICY IF EXISTS "Allow public read-only access to overrides" ON public.ufc_fighter_overrides;

-- Re-create policies
CREATE POLICY "Allow public read-only access to overrides"
ON public.ufc_fighter_overrides FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to manage overrides" 
ON public.ufc_fighter_overrides FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Storage policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Public Read Access"
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
