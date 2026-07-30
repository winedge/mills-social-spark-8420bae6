import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Users, PartyPopper, Building2, Mic2, Disc3, Calendar, MapPin } from "lucide-react";
import * as Icons from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import LightRays from "@/components/LightRays";
import concertImg from "@/assets/party-concert.jpg";
import celebrationImg from "@/assets/party-celebration.jpg";
import djImg from "@/assets/party-dj.jpg";
import { usePartySpaces, usePartyShows } from "@/lib/content";

export const Route = createFileRoute("/party")({
  head: () => ({
    meta: [
      { title: "Party & Live Events — Mills Modern Social Tempe" },
      { name: "description", content: "Live concerts, DJ nights, and private parties at Mills Modern Social in Tempe. Reserve a space or catch the next show." },
      { property: "og:title", content: "Live Events & Private Parties — Mills Modern Social" },
      { property: "og:description", content: "Stage lights, live music, and unforgettable nights in Tempe, AZ." },
    ],
  }),
  component: PartyPage,
});

const showImageFallbacks = [concertImg, djImg, celebrationImg];

function iconFor(name: string) {
  const C = (Icons as any)[name];
  return (C ?? Users) as typeof Users;
}

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(30),
  date: z.string().min(1, "Pick a date"),
  size: z.coerce.number().int().min(1, "At least 1").max(500, "Too large"),
  space: z.enum(["Bar Lounge", "Game Floor Buyout", "Full Venue", "Not sure yet"]),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function PartyPage() {
  const [submitting, setSubmitting] = useState(false);
  const dbSpaces = usePartySpaces();
  const dbShows = usePartyShows();
  const spaces = dbSpaces.map((s) => ({
    icon: iconFor(s.icon),
    name: s.name,
    capacity: s.capacity,
    price: s.price,
    desc: s.description,
  }));
  const upcomingShows = dbShows.map((s, i) => ({
    date: s.date_label,
    time: s.time_label,
    act: s.act,
    type: s.event_type,
    genre: s.genre,
    img: s.image_url || showImageFallbacks[i % showImageFallbacks.length],
  }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const parsed = formSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      date: fd.get("date"),
      size: fd.get("size"),
      space: fd.get("space"),
      message: fd.get("message") ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      setSubmitting(false);
      return;
    }
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const payload = {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        event_date: parsed.data.date,
        party_size: parsed.data.size,
        space: parsed.data.space,
        message: parsed.data.message || null,
      };
      const { error } = await supabase.from("space_reservations").insert(payload);
      if (error) throw error;
      try {
        const { notifySpaceBooking } = await import("@/lib/notify.functions");
        await notifySpaceBooking({ data: payload });
      } catch (waErr) {
        console.warn("WhatsApp notify failed", waErr);
      }

      toast.success("Thanks! We'll be in touch within 24 hours.");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send request. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader />
      <Toaster />

      {/* Hero — concert vibe with LightRays */}
      <section className="relative min-h-[85vh] flex items-center border-b border-border overflow-hidden bg-black">
        {/* Concert photo backdrop */}
        <div className="absolute inset-0">
          <img
            src={concertImg}
            alt="Live concert at Mills Modern Social"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-background" />
        </div>

        {/* Animated light rays */}
        <div className="absolute inset-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#38bdf8"
            raysSpeed={1.4}
            lightSpread={0.9}
            rayLength={1.4}
            followMouse={true}
            mouseInfluence={0.15}
            noiseAmount={0.08}
            distortion={0.05}
            pulsating
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="inline-flex items-center gap-2 border border-accent/50 bg-black/40 backdrop-blur px-3 py-1.5 mb-6">
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-accent text-[10px] tracking-[0.3em]">STAGE · LIGHTS · PARTY</span>
          </div>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.85] mb-6 text-balance drop-shadow-2xl">
            The night is<br />
            <span className="text-accent italic">yours.</span>
          </h1>
          <p className="text-white/80 max-w-2xl text-pretty text-lg md:text-xl mb-8">
            Live bands. DJ sets. Sold-out birthdays. Whether you're catching a show or
            throwing one — Mills is where Tempe turns it up.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#reserve" className="px-8 h-12 inline-flex items-center bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform">
              Reserve a space →
            </a>
            <a href="#shows" className="px-8 h-12 inline-flex items-center border border-white/40 text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors">
              See upcoming shows
            </a>
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <div className="border-b border-border bg-accent text-primary-foreground overflow-hidden">
        <div className="flex whitespace-nowrap animate-[marquee_35s_linear_infinite] py-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 pr-8 font-mono text-xs tracking-[0.25em]">
              <span>★ LIVE MUSIC THU–SAT</span>
              <span>★ DJ NIGHTS EVERY WEEKEND</span>
              <span>★ PRIVATE BOOKINGS 7 DAYS A WEEK</span>
              <span>★ NO COVER BEFORE 9PM</span>
              <span>★ FULL STAGE + PA SYSTEM</span>
              <span>★ TEMPE, AZ</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming shows */}
      <section id="shows" className="relative py-20 md:py-28 px-6 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_90%_80%,rgba(168,85,247,0.10),transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">ON STAGE NEXT</span>
              <h2 className="font-display text-5xl md:text-6xl uppercase leading-none">Upcoming <span className="text-accent italic">shows</span></h2>
            </div>
            <p className="text-muted-foreground max-w-md">Free entry with dinner. Doors open 30 min before showtime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingShows.map((s) => (
              <article key={s.act + s.date} className="group relative overflow-hidden border border-border bg-surface/60 hover:border-accent transition-colors">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={s.img} alt={s.act} loading="lazy" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 bg-accent text-primary-foreground px-2 py-1 font-mono text-[10px] tracking-widest">
                    {s.type}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-mono text-accent text-[10px] tracking-widest mb-1">{s.date} · {s.time}</div>
                    <div className="font-display text-2xl uppercase text-white leading-tight">{s.act}</div>
                    <div className="text-white/60 text-xs mt-1">{s.genre}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What we host */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">WHAT WE HOST</span>
            <h2 className="font-display text-5xl md:text-6xl uppercase">Every kind of <span className="text-accent italic">night</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Mic2, title: "Live Concerts", desc: "Local and touring acts on our full stage with pro lights and sound." },
              { icon: Disc3, title: "DJ Nights", desc: "Resident and guest DJs — house, hip-hop, Top 40, throwbacks." },
              { icon: PartyPopper, title: "Private Parties", desc: "Birthdays, bachelor(ette), corporate, watch parties — booked your way." },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="group relative border border-border bg-surface/40 p-8 hover:border-accent transition-colors overflow-hidden">
                  <div className="absolute -top-10 -right-10 size-32 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />
                  <div className="relative">
                    <div className="size-14 grid place-items-center border border-accent/40 bg-accent/5 text-accent mb-6">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="font-display text-3xl uppercase mb-2">{c.title}</h3>
                    <p className="text-muted-foreground text-pretty">{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Spaces + form */}
      <section id="reserve" className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12">
          {/* Spaces */}
          <div className="flex flex-col gap-4">
            <div className="mb-2">
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-2">CHOOSE YOUR SPACE</span>
              <h2 className="font-display text-4xl md:text-5xl uppercase leading-none">Three ways to <span className="text-accent italic">celebrate</span></h2>
            </div>
            {spaces.map((s) => {
              const Icon = s.icon;
              return (
                <article key={s.name} className="border border-border bg-surface/40 p-6 flex gap-5 hover:border-accent/60 hover:bg-surface transition-all">
                  <div className="size-12 grid place-items-center border border-accent/30 bg-accent/5 text-accent shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <h3 className="font-display text-2xl uppercase">{s.name}</h3>
                      <span className="font-mono text-[10px] text-accent tracking-widest">{s.capacity}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 text-pretty">{s.desc}</p>
                    <div className="font-mono text-[11px] tracking-widest uppercase text-foreground mt-3">{s.price}</div>
                  </div>
                </article>
              );
            })}

            <div className="mt-4 border border-border bg-surface/40 p-6 flex gap-4 items-center">
              <MapPin className="size-5 text-accent shrink-0" />
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">Mills Modern Social</span> · Tempe, AZ · Booking questions?{" "}
                <a href="tel:+14805550100" className="text-accent hover:underline">(480) 555-0100</a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="relative border border-accent/30 bg-accent/5 p-8 md:p-10 overflow-hidden">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-2">RESERVATION REQUEST</span>
              <h2 className="font-display text-3xl md:text-4xl uppercase mb-6">Tell us about your event</h2>
              <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Your name" name="name" required maxLength={100} />
                <Field label="Email" name="email" type="email" required maxLength={255} />
                <Field label="Phone" name="phone" type="tel" required maxLength={30} />
                <Field label="Event date" name="date" type="date" required />
                <Field label="Party size" name="size" type="number" min={1} max={500} required />
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Space</label>
                  <select
                    name="space"
                    required
                    defaultValue=""
                    className="bg-background border border-border px-3 h-11 text-sm outline-none focus:border-accent"
                  >
                    <option value="" disabled>Choose a space</option>
                    <option>Bar Lounge</option>
                    <option>Game Floor Buyout</option>
                    <option>Full Venue</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Message (optional)</label>
                  <textarea
                    name="message"
                    rows={4}
                    maxLength={1000}
                    placeholder="Tell us about the occasion, food & drink needs, timing, live music preferences…"
                    className="bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest flex items-center gap-2">
                    <Calendar className="size-3" /> WE'LL REPLY WITHIN 24 HOURS
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 h-11 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                  >
                    {submitting ? "Sending…" : "Send Request →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  min,
  max,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        maxLength={maxLength}
        className="bg-background border border-border px-3 h-11 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
