import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import heroBar from "@/assets/hero-bar.jpg.asset.json";
import heroVideo from "@/assets/hero-loop.mp4.asset.json";
import marqueeImagesAsset from "@/assets/marquee-images.png.asset.json";

/** Locally bundled so it resolves on any deployment target. */
const DEFAULT_HERO_VIDEO = heroVideo.url;
import menuBurger from "@/assets/menu-burger.jpg.asset.json";
import menuCocktail from "@/assets/menu-cocktail.jpg.asset.json";
import menuWings from "@/assets/menu-wings.jpg.asset.json";
import { useDailySpecialsState, useWeeklyPulseState } from "@/lib/content";
import {
  DailySpecialsSkeleton,
  WeeklyPulseSkeleton,
  NflSectionSkeleton,
  UfcSectionSkeleton,
} from "@/components/skeletons";
import pulseHappyHour from "@/assets/pulse-happy-hour.jpg.asset.json";
import pulseTrivia from "@/assets/pulse-trivia.jpg.asset.json";
import pulseLiveMusic from "@/assets/pulse-live-music.jpg.asset.json";
import pulseBrunch from "@/assets/pulse-brunch.jpg.asset.json";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { openReservation } from "@/components/reservation-modal";
import { SiteFooter } from "@/components/site-footer";
import { UfcSection, ufcQueryOptions } from "@/components/ufc-section";
import { NflSection, nflQueryOptions } from "@/components/nfl-section";
import WarpText from "@/components/ui/warp-text";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mill's Modern Social - Sports Bar & Kitchen in Tempe, AZ" },
      {
        name: "description",
        content:
          "Mills Social Hub is a modern, user-friendly website for a sports bar in Tempe, Arizona.",
      },
      { property: "og:title", content: "Mill's Modern Social - Sports Bar & Kitchen in Tempe, AZ" },
      {
        property: "og:description",
        content: "Mills Social Hub is a modern, user-friendly website for a sports bar in Tempe, Arizona.",
      },
      { property: "og:image", content: heroBar.url },
      { name: "twitter:image", content: heroBar.url },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(ufcQueryOptions),
      context.queryClient.ensureQueryData(nflQueryOptions),
    ]),
  component: Home,
});

const fallbackSpecials = [
  {
    img: menuBurger,
    day: "MONDAY",
    badge: "1/2 OFF",
    title: "Burger Night",
    desc: "Every Mill Burger and Tempe Smash - half price all night.",
    price: "from $8",
  },
  {
    img: menuWings,
    day: "TUESDAY",
    badge: "$1 EACH",
    title: "Wing It",
    desc: "Dollar wings, any flavor, with any pitcher of draft beer.",
    price: "$1 / wing",
  },
  {
    img: menuCocktail,
    day: "WEDNESDAY",
    badge: "2 FOR 1",
    title: "Craft Cocktail Night",
    desc: "Two-for-one on every house cocktail from 6PM to close.",
    price: "from $7",
  },
];

const fallbackSchedule = [
  { days: "MON–WED", title: "HAPPY HOUR", copy: "4PM–7PM. $2 off all drafts & signature cocktails.", accent: false, img: pulseHappyHour },
  { days: "THURSDAY", title: "TRIVIA NIGHT", copy: "8PM start. Win a $50 bar tab. Hosted by DJ Mac.", accent: true, img: pulseTrivia },
  { days: "FRIDAY", title: "LIVE SESSIONS", copy: "Local artists 9PM–late. High-energy acoustic sets.", accent: false, img: pulseLiveMusic },
  { days: "SAT–SUN", title: "GAME DAY BRUNCH", copy: "Open early for kickoff. Bottomless mimosas & sliders.", accent: true, img: pulseBrunch },
];



function OpenStatus() {
  const [open, setOpen] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const ranges: Record<number, [number, number] | null> = {
      0: [11 * 60, 22 * 60], // Sunday 11am-10pm
      1: [15 * 60, 22 * 60], // Monday 3pm-10pm
      2: [11 * 60, 22 * 60], // Tuesday
      3: [11 * 60, 22 * 60], // Wednesday
      4: [11 * 60, 26 * 60], // Thursday 11am-2am (next day)
      5: [11 * 60, 26 * 60], // Friday
      6: [11 * 60, 26 * 60], // Saturday
    };

    const range = ranges[day];
    let isOpen = false;
    if (range) {
      const [start, end] = range;
      isOpen = currentMinutes >= start && currentMinutes < end;
    }
    setOpen(isOpen);
  }, []);

  if (open === null) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
        <span className="size-2 rounded-full bg-muted-foreground" />
        Check Hours
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
      <span className={`size-2 rounded-full ${open ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
      {open ? "Open Now" : "Closed Now"}
    </span>
  );
}

function useHeroVideo() {
  const [url, setUrl] = React.useState<string>(DEFAULT_HERO_VIDEO);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("site_media").select("hero_video_url").eq("id", 1).maybeSingle();
      const path = data?.hero_video_url;
      if (!path || cancelled) return;
      if (path.startsWith("http")) { setUrl(path); return; }
      const { data: signed } = await supabase.storage.from("site-media").createSignedUrl(path, 60 * 60 * 24 * 7);
      if (!cancelled && signed?.signedUrl) setUrl(signed.signedUrl);
    })();
    return () => { cancelled = true; };
  }, []);
  return url;
}

function useMarqueeImages() {
  const [images, setImages] = React.useState<string[]>([]);
  React.useEffect(() => {
    supabase.from("marquee_images").select("image_url").order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setImages(data.map(d => d.image_url));
        }
      });
  }, []);
  return images;
}

function Home() {
  const heroSrc = useHeroVideo();
  const marqueeImages = useMarqueeImages();
  const { items: dbSpecials, loading: specialsLoading } = useDailySpecialsState();
  const specialImgs = [menuBurger.url, menuWings.url, menuCocktail.url];
  const dailySpecials = dbSpecials.length
    ? dbSpecials.map((s, i) => ({
        img: (s.image_url ? (s.image_url.startsWith('/') ? s.image_url : s.image_url) : specialImgs[i % specialImgs.length]) as any,
        day: s.day,
        badge: s.badge,
        title: s.title,
        desc: s.description,
        price: s.price,
      }))
    : fallbackSpecials;

  const { items: dbPulse, loading: pulseLoading } = useWeeklyPulseState();
  const pulseImgs = [pulseHappyHour.url, pulseTrivia.url, pulseLiveMusic.url, pulseBrunch.url];
  const schedule = dbPulse.length
    ? dbPulse.map((s, i) => ({
        days: s.days_label,
        title: s.title,
        copy: s.copy,
        accent: s.accent,
        img: (s.image_url ? (s.image_url.startsWith('/') ? s.image_url : s.image_url) : pulseImgs[i % pulseImgs.length]) as any,
      }))
    : fallbackSchedule;

  return (
    <div className="bg-background text-foreground font-body">
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[75vh] min-h-[560px] flex items-center justify-center overflow-hidden">
        <video
          src={heroSrc}
          key={heroSrc}
          poster={heroBar.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
        <h1
          aria-hidden
          className="font-display text-[12vw] leading-[0.8] uppercase tracking-tighter opacity-[0.05] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none whitespace-nowrap"
        >
          MILLS
        </h1>
        <div className="relative z-10 text-center px-6 animate-slide-up max-w-5xl">
          <span className="block font-mono text-accent text-xs md:text-sm mb-3 tracking-[0.3em]">
            TEMPE, AZ · MODERN SPORTS SOCIAL
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase leading-[1.05] tracking-tight mb-4 text-balance">
            Where Tempe comes to watch, eat & celebrate
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-base md:text-lg text-pretty">
            Ice-cold drinks. Scratch-made food. Every big game on the biggest screens.
          </p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => openReservation()}
              className="px-8 py-3 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform inline-block"
            >
              Reserve a Table
            </button>
            <Link
              to="/menu"
              className="px-8 py-3 border border-foreground/20 bg-surface/80 backdrop-blur-sm font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              View Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section id="hours" className="px-6 -mt-12 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-stretch border-2 border-border bg-surface shadow-[20px_20px_0px_0px_rgba(56,189,248,0.08)] overflow-hidden">
            {/* Location */}
            <div className="flex-1 p-8 md:p-10 border-b-2 md:border-b-0 md:border-r-2 border-border flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="font-display text-6xl md:text-7xl font-black uppercase tracking-tighter text-accent leading-none mb-4">
                  Find Us
                </h2>
                <p className="text-foreground text-xl font-semibold mb-1">
                  83 E Broadway Rd, Tempe, Arizona 85282
                </p>
                <p className="text-muted-foreground font-medium tracking-wide">Tempe, Arizona</p>
              </div>

              <div className="mt-10 flex flex-col gap-4 relative z-10">
                <a
                  href="https://maps.google.com/?q=83+E+Broadway+Rd+Tempe+AZ+85282"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors group"
                >
                  <span className="h-px w-8 bg-border group-hover:bg-accent transition-colors" />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold">Get Directions</span>
                </a>
              </div>

              {/* Background decorative mark */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.04] pointer-events-none select-none">
                <span className="font-display text-[12rem] font-black uppercase leading-none">MMS</span>
              </div>
            </div>

            {/* Hours */}
            <div className="flex-[2] p-8 md:p-10 bg-surface-secondary/30 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-8">
                <OpenStatus />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
                <div className="space-y-1">
                  <p className="font-display text-lg uppercase font-bold tracking-wider text-muted-foreground">Monday</p>
                  <p className="text-foreground font-bold text-lg tabular-nums">3PM – 10PM</p>
                </div>
                <div className="space-y-1">
                  <p className="font-display text-lg uppercase font-bold tracking-wider text-muted-foreground">Tuesday – Wednesday</p>
                  <p className="text-foreground font-bold text-lg tabular-nums">11AM – 10PM</p>
                </div>
                <div className="space-y-1">
                  <p className="font-display text-lg uppercase font-bold tracking-wider text-accent">Thursday, Friday + Saturday</p>
                  <p className="text-foreground font-bold text-lg tabular-nums text-accent">11AM – 2AM</p>
                </div>
                <div className="space-y-1">
                  <p className="font-display text-lg uppercase font-bold tracking-wider text-muted-foreground">Sunday</p>
                  <p className="text-foreground font-bold text-lg tabular-nums">11AM – 10PM</p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-border/50 flex flex-wrap gap-x-12 gap-y-4">
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Game Day</p>
                  <p className="text-muted-foreground text-sm font-semibold">Every screen, every league</p>
                </div>
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => openReservation()}
                    className="inline-block px-6 py-3 bg-accent text-primary-foreground font-black uppercase text-sm tracking-tighter transition-all hover:brightness-110 active:translate-y-0.5"
                  >
                    Book a Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Image Marquee Slider - Completely edge-to-edge */}
      <div className="w-full overflow-hidden relative border-y border-accent/20 bg-black py-0">
        <div className="flex animate-marquee whitespace-nowrap">
          {(marqueeImages.length > 0 ? [...marqueeImages, ...marqueeImages] : [marqueeImagesAsset.url, marqueeImagesAsset.url]).map((url, i) => (
            <div key={i} className="flex shrink-0 items-center">
              <img 
                src={url} 
                alt="Mill's Social Atmosphere" 
                className="h-[300px] md:h-[400px] lg:h-[500px] w-auto object-cover"
              />
            </div>
          ))}
        </div>
      </div>



      {/* Scoreboard */}
      <div id="sports">
        <React.Suspense fallback={<NflSectionSkeleton />}>
          <NflSection />
        </React.Suspense>
      </div>

      <React.Suspense fallback={<UfcSectionSkeleton />}>
        <UfcSection />
      </React.Suspense>

      {/* Daily Specials */}
      <section id="specials" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">
                THIS WEEK · ON ROTATION
              </span>
              <h3 className="font-display text-5xl uppercase mb-4">
                Daily <span className="text-accent">Specials</span>
              </h3>
              <p className="text-muted-foreground text-pretty">
                A new reason to show up every night of the week. House specials, big
                discounts, and the best bar food in Tempe.
              </p>
            </div>
            <Link
              to="/menu"
              className="font-mono text-xs border-b border-accent pb-1 tracking-widest hover:text-accent transition-colors"
            >
              VIEW FULL MENU →
            </Link>
          </div>

          {specialsLoading ? <DailySpecialsSkeleton /> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dailySpecials.map((s) => (
              <article key={s.day} className="group relative">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-surface relative">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-accent text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                    {s.day}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm font-display text-xl uppercase px-3 py-1.5 text-accent">
                    {s.badge}
                  </div>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-display text-2xl uppercase tracking-wide">{s.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                  </div>
                  <span className="font-mono text-accent text-sm shrink-0 whitespace-nowrap">
                    {s.price}
                  </span>
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Weekly schedule */}
      <section id="events" className="bg-surface py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">EVERY WEEK</span>
            <h3 className="font-display text-5xl uppercase">
              Weekly <span className="text-accent">pulse</span>
            </h3>
          </div>
          {pulseLoading ? <WeeklyPulseSkeleton /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {schedule.map((s) => (
              <div key={s.title} className="bg-background flex flex-col group overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-surface relative">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <span
                    className={`absolute top-4 left-4 font-mono text-[10px] tracking-widest px-2 py-1 ${
                      s.accent ? "bg-accent text-primary-foreground" : "bg-background/80 text-foreground"
                    }`}
                  >
                    {s.days}
                  </span>
                </div>
                <div className="p-6">
                  <h5 className="font-display text-2xl uppercase mb-2">{s.title}</h5>
                  <p className="text-sm text-muted-foreground">{s.copy}</p>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
