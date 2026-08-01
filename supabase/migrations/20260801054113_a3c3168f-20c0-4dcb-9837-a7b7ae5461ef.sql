GRANT SELECT ON public.nfl_streamed_games TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfl_streamed_games TO authenticated;
GRANT ALL ON public.nfl_streamed_games TO service_role;