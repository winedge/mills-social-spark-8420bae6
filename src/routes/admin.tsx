import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield, Loader2, Mail, Phone, Calendar, Users, MapPin, Trash2, Check } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Mill's Modern Social" },
      { name: "description", content: "Admin panel for reservation and event submissions." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  party_size: number;
  special_requests: string | null;
  status: string;
  created_at: string;
};

type SpaceReservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  event_date: string;
  party_size: number;
  space: string;
  message: string | null;
  status: string;
  created_at: string;
};

function AdminPage() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) {
        // Try to claim first admin
        await supabase.rpc("claim_first_admin");
        const { data: recheck } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!recheck);
      } else {
        setIsAdmin(true);
      }
      setChecking(false);
    })();
  }, [session]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!session) return <AdminLogin />;
  if (!isAdmin) return <NotAdmin email={session.user.email ?? ""} />;
  return <AdminDashboard email={session.user.email ?? ""} />;
}

function AdminLogin() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-4">
      <div className="w-full max-w-md border border-border bg-surface p-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="size-5 text-accent" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase">Admin Access</p>
        </div>
        <h1 className="font-display text-4xl uppercase leading-none mb-2">
          Mill's <span className="text-accent italic">admin</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" ? "Sign in to view reservations." : "Create the first admin account."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full bg-background border border-border px-3 h-11 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full bg-background border border-border px-3 h-11 text-sm outline-none focus:border-accent"
            />
          </label>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent text-primary-foreground py-3 font-bold uppercase tracking-widest text-sm hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
          }}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-accent transition-colors font-mono uppercase tracking-widest"
        >
          {mode === "signin" ? "First time? Create admin account →" : "Have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-4">
      <div className="max-w-md text-center border border-border bg-surface p-8">
        <Shield className="size-8 text-accent mx-auto mb-4" />
        <h1 className="font-display text-3xl uppercase mb-2">Not authorized</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {email} does not have admin access. Ask an existing admin to grant it.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-6 h-11 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<"reservations" | "spaces">("reservations");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [spaces, setSpaces] = useState<SpaceReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([
      supabase.from("reservations").select("*").order("created_at", { ascending: false }),
      supabase.from("space_reservations").select("*").order("created_at", { ascending: false }),
    ]);
    setReservations((r.data as Reservation[]) ?? []);
    setSpaces((s.data as SpaceReservation[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(
    () => ({
      reservations: reservations.filter((r) => r.status === "new").length,
      spaces: spaces.filter((s) => s.status === "new").length,
    }),
    [reservations, spaces],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-accent" />
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase">Mill's Modern Social</p>
              <h1 className="font-display text-xl uppercase leading-none">Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-muted-foreground font-mono">{email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 px-4 h-9 border border-border hover:border-accent hover:text-accent text-xs font-bold uppercase tracking-widest"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <TabButton
            active={tab === "reservations"}
            onClick={() => setTab("reservations")}
            label="Table Reservations"
            count={counts.reservations}
          />
          <TabButton
            active={tab === "spaces"}
            onClick={() => setTab("spaces")}
            label="Space Reservations"
            count={counts.spaces}
          />
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-8 animate-spin text-accent" />
          </div>
        ) : tab === "reservations" ? (
          <ReservationsList items={reservations} onChanged={refresh} />
        ) : (
          <SpacesList items={spaces} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors ${
        active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent text-primary-foreground text-[10px]">
          {count}
        </span>
      )}
    </button>
  );
}

function ReservationsList({ items, onChanged }: { items: Reservation[]; onChanged: () => void }) {
  if (items.length === 0) return <Empty label="No table reservations yet." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((r) => (
        <Card
          key={r.id}
          name={r.name}
          status={r.status}
          created={r.created_at}
          rows={[
            { icon: Calendar, label: `${r.date} · ${r.time}` },
            { icon: Users, label: `${r.party_size} guests` },
            { icon: Mail, label: r.email },
            { icon: Phone, label: r.phone },
          ]}
          note={r.special_requests}
          onMark={async () => {
            await supabase.from("reservations").update({ status: "handled" }).eq("id", r.id);
            onChanged();
          }}
          onDelete={async () => {
            if (!confirm("Delete this reservation?")) return;
            await supabase.from("reservations").delete().eq("id", r.id);
            onChanged();
          }}
        />
      ))}
    </div>
  );
}

function SpacesList({ items, onChanged }: { items: SpaceReservation[]; onChanged: () => void }) {
  if (items.length === 0) return <Empty label="No space reservation requests yet." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((s) => (
        <Card
          key={s.id}
          name={s.name}
          status={s.status}
          created={s.created_at}
          rows={[
            { icon: Calendar, label: s.event_date },
            { icon: Users, label: `${s.party_size} guests` },
            { icon: MapPin, label: s.space },
            { icon: Mail, label: s.email },
            { icon: Phone, label: s.phone },
          ]}
          note={s.message}
          onMark={async () => {
            await supabase.from("space_reservations").update({ status: "handled" }).eq("id", s.id);
            onChanged();
          }}
          onDelete={async () => {
            if (!confirm("Delete this request?")) return;
            await supabase.from("space_reservations").delete().eq("id", s.id);
            onChanged();
          }}
        />
      ))}
    </div>
  );
}

function Card({
  name,
  status,
  created,
  rows,
  note,
  onMark,
  onDelete,
}: {
  name: string;
  status: string;
  created: string;
  rows: { icon: any; label: string }[];
  note: string | null;
  onMark: () => void;
  onDelete: () => void;
}) {
  const isNew = status === "new";
  return (
    <article className={`border p-5 bg-surface/40 ${isNew ? "border-accent/60" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-2xl uppercase leading-none">{name}</h3>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {new Date(created).toLocaleString()}
          </p>
        </div>
        <span
          className={`font-mono text-[10px] px-2 py-1 tracking-widest uppercase ${
            isNew ? "bg-accent text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
        {rows.map((r, i) => {
          const I = r.icon;
          return (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <I className="size-3.5 text-accent shrink-0" />
              <span className="truncate">{r.label}</span>
            </div>
          );
        })}
      </div>
      {note && (
        <p className="text-sm text-foreground border-l-2 border-accent pl-3 py-1 mb-3 whitespace-pre-wrap">
          {note}
        </p>
      )}
      <div className="flex gap-2 pt-2 border-t border-border">
        {isNew && (
          <button
            onClick={onMark}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent"
          >
            <Check className="size-3" /> Mark handled
          </button>
        )}
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-red-500 hover:text-red-500 ml-auto"
        >
          <Trash2 className="size-3" /> Delete
        </button>
      </div>
    </article>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-border p-16 text-center">
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}
