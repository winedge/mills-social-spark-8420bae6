import { useState, type FormEvent } from "react";
import { Loader2, Check, Send } from "lucide-react";
import { submitInquiry } from "@/lib/inquiries.functions";

type Props = {
  kind: "events" | "play";
  title: string;
  blurb: string;
  dateLabel?: string;
  guestsLabel?: string;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;
  spaceOptions?: string[];
  note?: string;
};

export function InquiryForm({
  kind,
  title,
  blurb,
  dateLabel = "Preferred date",
  guestsLabel = "Guests",
  subjectPlaceholder = "What are you planning?",
  messagePlaceholder = "Tell us a bit more…",
  spaceOptions,
  note,
}: Props) {
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErr(null);
    setStatus("busy");
    try {
      const guestsRaw = String(fd.get("guests") ?? "").trim();
      await submitInquiry({
        data: {
          kind,
          name: String(fd.get("name") ?? "").trim(),
          email: String(fd.get("email") ?? "").trim(),
          phone: String(fd.get("phone") ?? "").trim(),
          eventDate: String(fd.get("event_date") ?? "").trim(),
          guests: guestsRaw ? Number(guestsRaw) : undefined,
          subject: [String(fd.get("space") ?? "").trim(), String(fd.get("subject") ?? "").trim()]
            .filter(Boolean)
            .join(" — "),
          message: String(fd.get("message") ?? "").trim(),
        },
      });
      form.reset();
      setStatus("done");
    } catch {
      setStatus("idle");
      setErr("Couldn't send that. Please try again or give us a call.");
    }
  };

  return (
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto border border-border bg-surface/40 p-8 md:p-12">
        <h2 className="font-display text-4xl md:text-5xl uppercase mb-3">{title}</h2>
        <p className="text-sm text-muted-foreground mb-8">{blurb}</p>

        {status === "done" ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="mx-auto size-16 rounded-full bg-accent/15 grid place-items-center mb-5 animate-scale-in">
              <Check className="size-8 text-accent" strokeWidth={3} />
            </div>
            <h3 className="font-display text-2xl uppercase mb-2">Request sent</h3>
            <p className="text-sm text-muted-foreground">Our team will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name">
                <input required name="name" className="inq-input" placeholder="Jane Doe" />
              </Field>
              <Field label="Phone">
                <input name="phone" type="tel" className="inq-input" placeholder="(602) 689-5361" />
              </Field>
            </div>
            <Field label="Email">
              <input required name="email" type="email" className="inq-input" placeholder="you@email.com" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={dateLabel}>
                <input name="event_date" type="date" className="inq-input" />
              </Field>
              <Field label={guestsLabel}>
                <input name="guests" type="number" min={1} className="inq-input" placeholder="12" />
              </Field>
            </div>
            {spaceOptions && spaceOptions.length > 0 && (
              <Field label="Space">
                <select name="space" defaultValue="" className="inq-input">
                  <option value="">Not sure yet</option>
                  {spaceOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Subject">
              <input name="subject" className="inq-input" placeholder={subjectPlaceholder} />
            </Field>
            <Field label="Details">
              <textarea required name="message" rows={5} className="inq-input resize-none" placeholder={messagePlaceholder} />
            </Field>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">We'll reply within 24 hours</p>
            {note && <p className="text-[11px] text-muted-foreground text-pretty">{note}</p>}
            <button
              disabled={status === "busy"}
              className="w-full bg-accent text-primary-foreground py-4 font-bold uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.99] transition inline-flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {status === "busy" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {status === "busy" ? "Sending…" : "Send request"}
            </button>
          </form>
        )}
        <style>{`
          .inq-input {
            width: 100%;
            background: var(--color-background);
            border: 1px solid var(--color-border);
            padding: 0.7rem 0.8rem;
            font-size: 0.9rem;
            color: var(--color-foreground);
            outline: none;
            transition: border-color 150ms, box-shadow 150ms;
          }
          .inq-input:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
          }
        `}</style>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground block mb-2">{label}</span>
      {children}
    </label>
  );
}
