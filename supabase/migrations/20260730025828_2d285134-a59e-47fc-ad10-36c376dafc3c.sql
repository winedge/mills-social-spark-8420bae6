DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;

CREATE POLICY "Admins can read settings"
ON public.site_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.site_settings FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;