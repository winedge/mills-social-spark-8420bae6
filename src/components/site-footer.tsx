import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useContactInfo } from "@/lib/content";

function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim().toLowerCase();
    if (!email) return;
    setStatus("busy");
    setMsg(null);
    const { error } = await (supabase as any)
      .from("newsletter_subscribers")
      .insert({ email, source: "footer" });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      setStatus("error");
      setMsg("Couldn't sign you up. Try again.");
      return;
    }
    form.reset();
    setStatus("done");
    setMsg("You're in. Watch your inbox.");
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-3 border-b border-foreground/20 pb-2">
        <input
          type="email"
          name="email"
          required
          maxLength={255}
          placeholder="EMAIL ADDRESS"
          className="bg-transparent flex-1 py-2 text-sm outline-none font-mono placeholder:text-muted-foreground"
        />
        <button
          disabled={status === "busy"}
          className="font-display text-sm tracking-widest uppercase hover:text-accent transition-colors inline-flex items-center gap-2 disabled:opacity-60"
        >
          {status === "busy" ? <Loader2 className="size-3.5 animate-spin" /> : status === "done" ? <Check className="size-3.5 text-accent" /> : null}
          Join →
        </button>
      </div>
      {msg && (
        <p className={`font-mono text-[10px] uppercase tracking-widest ${status === "error" ? "text-red-500" : "text-accent"}`}>
          {msg}
        </p>
      )}
    </form>
  );
}

export function SiteFooter() {
  const contact = useContactInfo();
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer id="visit" className="py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <div className="font-display text-6xl md:text-7xl uppercase mb-8 leading-[0.9]">
            Come <br />
            <span className="text-accent">hang.</span>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <p>{contact?.address_line ?? "425 S MILL AVE, TEMPE, AZ 85281"}</p>
            <p className="text-muted-foreground">{contact?.hours_weekday ?? "SUN–THU · 11AM – 12AM"}</p>
            <p className="text-muted-foreground">{contact?.hours_weekend ?? "FRI–SAT · 11AM – 2AM"}</p>
            {contact?.phone && (
              <p className="text-muted-foreground pt-3">
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:text-accent">
                  {contact.phone}
                </a>
              </p>
            )}
            <div className="text-muted-foreground space-y-1">
              <p>
                <span className="text-[10px] uppercase opacity-50 mr-2">Info</span>
                <a href="mailto:info@millsmodernsocial.com" className="hover:text-accent uppercase">info@millsmodernsocial.com</a>
              </p>
              <p>
                <span className="text-[10px] uppercase opacity-50 mr-2">Parties</span>
                <a href="mailto:party@millsmodernsocial.com" className="hover:text-accent uppercase">party@millsmodernsocial.com</a>
              </p>
              <p>
                <span className="text-[10px] uppercase opacity-50 mr-2">Events</span>
                <a href="mailto:events@millsmodernsocial.com" className="hover:text-accent uppercase">events@millsmodernsocial.com</a>
              </p>
              <p>
                <span className="text-[10px] uppercase opacity-50 mr-2">Play</span>
                <a href="mailto:play@millsmodernsocial.com" className="hover:text-accent uppercase">play@millsmodernsocial.com</a>
              </p>
              <p>
                <span className="text-[10px] uppercase opacity-50 mr-2">Work</span>
                <a href="mailto:work-mms@millsmodernsocial.com" className="hover:text-accent uppercase">work-mms@millsmodernsocial.com</a>
              </p>
            </div>

          </div>
        </div>
        <div className="bg-accent/5 p-10 md:p-12 border border-accent/20 flex flex-col justify-between gap-12">
          <div>
            <h6 className="font-display text-3xl uppercase mb-4">Join the circle</h6>
            <p className="text-sm text-muted-foreground mb-8">
              Big games, watch parties, and private events - straight to your inbox.
            </p>
            <NewsletterForm />
          </div>
          <div className="flex gap-6">
            <a href={contact?.instagram_url || "#"} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: "#E4405F" }}>Instagram</a>
            <a href={contact?.facebook_url || "#"} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: "#1877F2" }}>Facebook</a>
            <a href={contact?.x_url || "#"} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: "#FFFFFF" }}>X / Twitter</a>
            <a href={contact?.tiktok_url || "#"} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: "#FFFFFF" }}>TikTok</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-2 opacity-50 text-[10px] font-mono tracking-tighter">
        <span>© {year} MILLS MODERN SOCIAL · ALL RIGHTS RESERVED</span>
        <span>TEMPE, ARIZONA</span>
      </div>
      <div className="max-w-7xl mx-auto mt-4 text-center font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        Designed With Love by N2N Solutions
      </div>
    </footer>
  );
}
