export type HeroVideos = {
  hero_video_url?: string | null;
  mobile_hero_video_url?: string | null;
};

export function selectHeroVideo(videos: HeroVideos, mobile: boolean, fallback: string) {
  return (mobile ? videos.mobile_hero_video_url || videos.hero_video_url : videos.hero_video_url) || fallback;
}

export function heroVideoSource(path: string) {
  return /^(https?:\/\/|storage:\/\/|\/)/.test(path) ? path : `storage://site-media/${path}`;
}