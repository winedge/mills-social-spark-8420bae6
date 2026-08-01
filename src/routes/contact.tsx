import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Clock, Loader2, Check, Send } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useContactInfo } from "@/lib/content";
import { openReservation } from "@/components/reservation-modal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Visit Us | Mill's Modern Social, Tempe" },
      {
        name: "description",
        content:
          "Find Mill's Modern Social on Mill Ave in Tempe — hours, phone, directions, and a direct line to our team for bookings and private events.",
      },
      { property: "og:title", content: "Contact Mill's Modern Social" },
      {
        property: "og:description",
        content: "Hours, directions and a direct line to the Mill's Modern Social team in Tempe, AZ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const FALLBACK_MAP =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.6194175359587!2d-111.94124292431101!3d33.40709197340681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x872b09f10e1e446b%3A0xb0712955863e70ff!2sMill's%20Modern%20Social!5e0!3m2!1sen!2sin!4v1785559000888!5m2!1sen!2sin";

function ContactPage() {
  const contact = useContactInfo();
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErr(null);
    setStatus("busy");
    const { error } = await (supabase as any).from("contact_messages").insert({
      name: String(fd.get("name") ?? "").trim().slice(0, 120),
      email: String(fd.get("email") ?? "").trim().slice(0, 255),
      phone: String(fd.get("phone") ?? "").trim().slice(0, 40),
      subject: String(fd.get("subject") ?? "").trim().slice(0, 160),
      message: String(fd.get("message") ?? "").trim().slice(0, 2000),
    });
    if (error) {
      setStatus("idle");
      setErr("Couldn't send your message. Please try again or give us a call.");
      return;
    }
    form.reset();
    setStatus("done");
  };

  const details = [
    { icon: MapPin, label: "Address", value: contact?.address_line ?? "425 S Mill Ave, Tempe, AZ 85281" },
    {
      icon: Clock,
      label: "Hours",
      value: `${contact?.hours_weekday ?? "SUN–THU · 11AM – 12AM"}\n${contact?.hours_weekend ?? "FRI–SAT · 11AM – 2AM"}`,
    },
    { icon: Phone, label: "Phone", value: contact?.phone ?? "(480) 555-0142" },
    { icon: Mail, label: "Email", value: contact?.email ?? "hello@millsmodernsocial.com" },
  ];

  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader />

      <section className="relative py-24 md:py-28 px-6 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(56,189,248,0.16),transparent_55%)]" />
        <div className="max-w-7xl mx-auto relative">
          <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-4">MILL AVE · TEMPE, AZ</span>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6 text-balance">
            Say <span className="text-accent">hello.</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-pretty text-lg">
            Questions about a booking, a private event, or which screen your game is on? Drop us a line —
            we answer fast.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {details.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.label} className="bg-background p-8 flex flex-col gap-3">
                <Icon className="size-5 text-accent" />
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  {d.label}
                </div>
                <div className="text-sm whitespace-pre-line">{d.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Form */}
          <div className="border border-border bg-surface/40 p-8 md:p-10">
            <h2 className="font-display text-4xl uppercase mb-2">Send a message</h2>
            <p className="text-sm text-muted-foreground mb-8">
              We reply within one business day. For same-day tables, use the reservation form.
            </p>

            {status === "done" ? (
              <div className="py-12 text-center animate-fade-in">
                <div className="mx-auto size-16 rounded-full bg-accent/15 grid place-items-center mb-5 animate-scale-in">
                  <Check className="size-8 text-accent" strokeWidth={3} />
                </div>
                <h3 className="font-display text-2xl uppercase mb-2">Message sent</h3>
                <p className="text-sm text-muted-foreground">Thanks — we'll be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ContactField label="Name">
                    <input required name="name" className="contact-input" placeholder="Jane Doe" />
                  </ContactField>
                  <ContactField label="Phone">
                    <input name="phone" type="tel" className="contact-input" placeholder="(480) 555-0123" />
                  </ContactField>
                </div>
                <ContactField label="Email">
                  <input required name="email" type="email" className="contact-input" placeholder="you@email.com" />
                </ContactField>
                <ContactField label="Subject">
                  <input name="subject" className="contact-input" placeholder="Private event enquiry" />
                </ContactField>
                <ContactField label="Message">
                  <textarea required name="message" rows={5} className="contact-input resize-none" placeholder="Tell us what you need…" />
                </ContactField>
                {err && <p className="text-sm text-red-500">{err}</p>}
                <button
                  disabled={status === "busy"}
                  className="w-full bg-accent text-primary-foreground py-4 font-bold uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.99] transition inline-flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === "busy" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {status === "busy" ? "Sending…" : "Send message"}
                </button>
                <button
                  type="button"
                  onClick={openReservation}
                  className="w-full border border-border py-3.5 font-bold uppercase tracking-widest text-xs hover:border-accent hover:text-accent transition"
                >
                  Reserve a table instead
                </button>
              </form>
            )}
            <style>{`
              .contact-input {
                width: 100%;
                background: hsl(var(--background));
                border: 1px solid hsl(var(--border));
                padding: 0.7rem 0.8rem;
                font-size: 0.9rem;
                color: hsl(var(--foreground));
                outline: none;
                transition: border-color 150ms, box-shadow 150ms;
              }
              .contact-input:focus {
                border-color: hsl(var(--accent));
                box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
              }
            `}</style>
          </div>

          {/* Map */}
          <div className="border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">Find us</span>
              <a
                href="https://maps.google.com/?q=Mill's+Modern+Social+Tempe"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-accent"
              >
                Get directions →
              </a>
            </div>
            <iframe
              title="Mill's Modern Social location map"
              src={contact?.map_embed_url || FALLBACK_MAP}
              className="w-full h-[520px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ContactField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
