import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Users, PartyPopper, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/party")({
  head: () => ({
    meta: [
      { title: "Party & Private Events — Mills Modern Social Tempe" },
      { name: "description", content: "Reserve a space for your party at Mills Modern Social in Tempe. Bar lounge, game floor buyouts, and full venue rentals." },
      { property: "og:title", content: "Host your party at Mills Modern Social" },
      { property: "og:description", content: "Private events, birthdays, corporate nights and game-floor buyouts in Tempe, AZ." },
    ],
  }),
  component: PartyPage,
});

const spaces = [
  { icon: Users, name: "Bar Lounge", capacity: "Up to 25", price: "From $250 min. spend", desc: "Reserved section of the main bar with dedicated bartender. Perfect for birthdays and small crews." },
  { icon: PartyPopper, name: "Game Floor Buyout", capacity: "Up to 60", price: "From $1,200 min. spend", desc: "Take over the pool tables, darts, and arcade for the night. Your own space, your own soundtrack." },
  { icon: Building2, name: "Full Venue", capacity: "Up to 200", price: "Custom quote", desc: "The whole house. Dining room, bar, patio, and game floor — ideal for corporate events and weddings." },
];

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
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Thanks! We'll be in touch within 24 hours.");
    (e.target as HTMLFormElement).reset();
    setSubmitting(false);
  }

  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader />
      <Toaster />

      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.15),transparent_55%)]" />
        <div className="max-w-7xl mx-auto relative">
          <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-4">
            PRIVATE EVENTS · TEMPE, AZ
          </span>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6 text-balance">
            Host it at <span className="text-accent">Mills</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-pretty text-lg">
            Birthdays, bachelor(ette) parties, watch parties, corporate nights — reserve a
            section of the bar, buy out the game floor, or take the whole place.
          </p>
        </div>
      </section>

      {/* Spaces + form */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12">
          {/* Spaces */}
          <div className="flex flex-col gap-4">
            <div className="mb-2">
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-2">CHOOSE YOUR SPACE</span>
              <h2 className="font-display text-4xl uppercase">Three ways to celebrate</h2>
            </div>
            {spaces.map((s) => {
              const Icon = s.icon;
              return (
                <article key={s.name} className="border border-border bg-surface/40 p-6 flex gap-5 hover:border-accent/40 transition-colors">
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
          </div>

          {/* Form */}
          <div className="border border-accent/30 bg-accent/5 p-8 md:p-10">
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
                  placeholder="Tell us about the occasion, food & drink needs, timing…"
                  className="bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                />
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
                  WE'LL REPLY WITHIN 24 HOURS
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
