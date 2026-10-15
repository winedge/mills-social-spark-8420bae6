ALTER TABLE public.site_media ADD COLUMN IF NOT EXISTS mobile_hero_video_url text;
COMMENT ON COLUMN public.site_media.hero_video_url IS 'Desktop homepage hero video; fallback when no mobile video is configured.';
COMMENT ON COLUMN public.site_media.mobile_hero_video_url IS 'Portrait homepage hero video for mobile viewers.';