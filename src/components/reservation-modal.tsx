import { useEffect, useState, type FormEvent } from "react";
import { X, Calendar, Clock, Users, User, Mail, Phone, Check } from "lucide-react";

export const RESERVATION_EVENT = "open-reservation";

/** Module-level store so a click always lands, even before the modal mounts. */
let requestedOpen = false;
const listeners = new Set<() => void>();

export function openReservation() {
  requestedOpen = true;
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RESERVATION_EVENT));
  }
}

type Status = "idle" | "submitting" | "success";

export function ReservationModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const handler = () => {
      requestedOpen = false;
      setStatus("idle");
      setOpen(true);
    };
    listeners.add(handler);
    window.addEventListener(RESERVATION_EVENT, handler);
    if (requestedOpen) handler();
    return () => {
      listeners.delete(handler);
      window.removeEventListener(RESERVATION_EVENT, handler);
    };
  }, []);


  useEffect(() => {
    setMounted(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      date: String(fd.get("date") ?? ""),
      time: String(fd.get("time") ?? ""),
      party_size: Number(fd.get("party_size") ?? 1),
      special_requests: String(fd.get("special_requests") ?? "") || null,
    };
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error: insertError } = await supabase.from("reservations").insert(payload);
      if (insertError) throw insertError;
      try {
        const { notifyTableBooking } = await import("@/lib/notify.functions");
        await notifyTableBooking({ data: payload });
      } catch (waErr) {
        console.warn("WhatsApp notify failed", waErr);
      }

      setStatus("success");
      form.reset();
      setTimeout(() => setOpen(false), 2200);
    } catch (err) {
      console.error(err);
      setStatus("idle");
      setError("Couldn't send reservation. Please call us or try again.");
    }
  };


  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Accent glow */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(56,189,248,0.18), transparent 70%)",
        }}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg bg-surface border border-border shadow-2xl will-change-transform ${
          mounted && open ? "res-panel-in" : "res-panel-out"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <p className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase mb-2">
              Mill's Modern Social
            </p>
            <h2
              id="reservation-title"
              className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-none"
            >
              Reserve a Table
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="size-10 grid place-items-center border border-border bg-background hover:border-accent hover:text-accent transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="relative">
          {status === "success" ? (
            <div className="p-10 text-center animate-fade-in">
              <div className="mx-auto size-16 rounded-full bg-accent/15 grid place-items-center mb-5 animate-scale-in">
                <Check className="size-8 text-accent" strokeWidth={3} />
              </div>
              <h3 className="font-display text-2xl uppercase tracking-tight mb-2">
                Table Reserved
              </h3>
              <p className="text-muted-foreground text-sm">
                We'll send a confirmation shortly. See you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 res-stagger">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<User className="size-4" />} label="Full Name">
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="Jane Doe"
                    className="input-base"
                  />
                </Field>
                <Field icon={<Phone className="size-4" />} label="Phone">
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="(480) 555-0123"
                    className="input-base"
                  />
                </Field>
              </div>

              <Field icon={<Mail className="size-4" />} label="Email">
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  className="input-base"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field icon={<Calendar className="size-4" />} label="Date">
                  <input required name="date" type="date" min={today} className="input-base" />
                </Field>
                <Field icon={<Clock className="size-4" />} label="Time">
                  <input required name="time" type="time" defaultValue="19:00" className="input-base" />
                </Field>
                <Field icon={<Users className="size-4" />} label="Party">
                  <select required name="party_size" defaultValue="2" className="input-base">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Special Requests (Optional)">
                <textarea
                  name="special_requests"
                  rows={3}
                  placeholder="Big game viewing, birthday, dietary needs…"
                  className="input-base resize-none"
                />
              </Field>

              {error && (
                <p className="text-sm text-red-500 font-mono uppercase tracking-wider text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-accent text-primary-foreground py-4 font-bold uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.99] transition disabled:opacity-70"
              >
                {status === "submitting" ? "Reserving…" : "Confirm Reservation"}
              </button>
              <p className="text-center font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Mill Ave &amp; Broadway · Tempe, AZ
              </p>
            </form>

          )}
        </div>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          padding: 0.65rem 0.75rem;
          font-size: 0.9rem;
          color: hsl(var(--foreground));
          transition: border-color 150ms, box-shadow 150ms;
          outline: none;
        }
        .input-base:focus {
          border-color: hsl(var(--accent));
          box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
        }
        @keyframes resPanelIn {
          0%   { opacity: 0; transform: translateY(34px) scale(0.94); filter: blur(6px); }
          55%  { opacity: 1; transform: translateY(-6px) scale(1.012); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes resFieldIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .res-panel-in {
          animation: resPanelIn 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .res-panel-out {
          opacity: 0;
          transform: translateY(24px) scale(0.95);
          transition: opacity 220ms ease, transform 260ms cubic-bezier(0.4, 0, 1, 1);
        }
        .res-stagger > * {
          animation: resFieldIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .res-stagger > *:nth-child(1) { animation-delay: 120ms; }
        .res-stagger > *:nth-child(2) { animation-delay: 175ms; }
        .res-stagger > *:nth-child(3) { animation-delay: 230ms; }
        .res-stagger > *:nth-child(4) { animation-delay: 285ms; }
        .res-stagger > *:nth-child(5) { animation-delay: 340ms; }
        .res-stagger > *:nth-child(6) { animation-delay: 395ms; }
        .res-stagger > *:nth-child(7) { animation-delay: 450ms; }
        @media (prefers-reduced-motion: reduce) {
          .res-panel-in, .res-stagger > * { animation: none; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
