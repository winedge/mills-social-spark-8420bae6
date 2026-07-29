import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  LogOut, Shield, Loader2, Mail, Phone, Calendar, Users, MapPin,
  Trash2, Check, LayoutDashboard, UtensilsCrossed, PartyPopper, Trophy,
  Settings as SettingsIcon, Menu as MenuIcon, X, Plus, Pencil, Save,
  MessageCircle, Search, ChevronRight, Sparkles, FolderTree, Eye, Activity,
  TrendingUp,
} from "lucide-react";
import logo from "@/assets/mills-logo.png.asset.json";
import {
  buildWhatsAppUrl, formatReservationMessage, formatSpaceMessage,
} from "@/lib/whatsapp";
import { estimateCalories } from "@/lib/menu-ai.functions";
import { getAnalytics, type AnalyticsStats } from "@/lib/analytics.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Mill's Modern Social" },
      { name: "description", content: "Admin panel." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Section =
  | "overview" | "reservations" | "spaces" | "menu" | "categories"
  | "party" | "sports" | "settings";

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "reservations", label: "Reservations", icon: Calendar },
  { id: "spaces", label: "Space Requests", icon: MapPin },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "party", label: "Party & Shows", icon: PartyPopper },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); setChecking(false); return; }
    setChecking(true);
    (async () => {
      const { data } = await supabase.from("user_roles").select("role")
        .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!data) {
        await supabase.rpc("claim_first_admin");
        const { data: r2 } = await supabase.from("user_roles").select("role")
          .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r2);
      } else setIsAdmin(true);
      setChecking(false);
    })();
  }, [session]);

  if (checking) {
    return <div className="min-h-screen bg-background grid place-items-center">
      <Loader2 className="size-8 animate-spin text-accent" /></div>;
  }
  if (!session) return <AdminLogin />;
  if (!isAdmin) return <NotAdmin email={session.user.email ?? ""} />;
  return <Dashboard email={session.user.email ?? ""} />;
}

function AdminLogin() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr(null); setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(fd.get("email")), password: String(fd.get("password")),
      });
      if (error) throw error;
    } catch (e: any) { setErr(e?.message ?? "Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-4">
      <div className="w-full max-w-md border border-border bg-surface p-8">
        <img src={logo.url} alt="Mill's" className="h-14 mx-auto mb-6" />
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Shield className="size-4 text-accent" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase">Admin Access</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input name="email" type="email" label="Email" required autoComplete="email" />
          <Input name="password" type="password" label="Password" required autoComplete="current-password" />
          {err && <p className="text-sm text-red-500">{err}</p>}
          <button disabled={busy} className="w-full bg-accent text-primary-foreground py-3 font-bold uppercase tracking-widest text-sm hover:brightness-110 disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
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
          {email} isn't an admin.
        </p>
        <button onClick={() => supabase.auth.signOut()} className="px-6 h-11 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs">
          Sign out
        </button>
      </div>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const [section, setSection] = useState<Section>("overview");
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border transform transition-transform lg:translate-x-0 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <img src={logo.url} alt="Mill's" className="h-10" />
          <button className="lg:hidden" onClick={() => setNavOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map((n) => {
            const I = n.icon;
            const active = section === n.id;
            return (
              <button key={n.id} onClick={() => { setSection(n.id); setNavOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium uppercase tracking-wider transition ${
                  active ? "bg-accent/15 text-accent border-l-2 border-accent" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border-l-2 border-transparent"
                }`}>
                <I className="size-4" /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border">
          <p className="text-[10px] font-mono text-muted-foreground truncate mb-2">{email}</p>
          <button onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 px-3 h-9 border border-border hover:border-accent hover:text-accent text-xs font-bold uppercase tracking-widest">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      {navOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3 px-6 py-4">
            <button className="lg:hidden" onClick={() => setNavOpen(true)}><MenuIcon className="size-5" /></button>
            <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase">Mill's · Admin</p>
            <ChevronRight className="size-3 text-muted-foreground" />
            <h1 className="font-display text-lg uppercase tracking-tight">{NAV.find(n => n.id === section)?.label}</h1>
          </div>
        </header>
        <main className="p-6">
          {section === "overview" && <Overview onNav={setSection} />}
          {section === "reservations" && <ReservationsSection />}
          {section === "spaces" && <SpacesSection />}
          {section === "menu" && <MenuSection />}
          {section === "categories" && <CategoriesSection />}
          {section === "party" && <PartySection />}
          {section === "sports" && <SportsSection />}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

/* ================= OVERVIEW ================= */

function Overview({ onNav }: { onNav: (s: Section) => void }) {
  const [stats, setStats] = useState({ res: 0, sp: 0, newRes: 0, newSp: 0, menu: 0 });
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [aLoading, setALoading] = useState(true);
  const fetchAnalytics = useServerFn(getAnalytics);

  useEffect(() => {
    (async () => {
      const [r, s, m] = await Promise.all([
        supabase.from("reservations").select("id,status"),
        supabase.from("space_reservations").select("id,status"),
        supabase.from("menu_items").select("id"),
      ]);
      setStats({
        res: r.data?.length ?? 0,
        newRes: r.data?.filter((x: any) => x.status === "new").length ?? 0,
        sp: s.data?.length ?? 0,
        newSp: s.data?.filter((x: any) => x.status === "new").length ?? 0,
        menu: m.data?.length ?? 0,
      });
    })();
  }, []);

  useEffect(() => {
    setALoading(true);
    fetchAnalytics({ data: { range } })
      .then((d) => setAnalytics(d))
      .catch(() => setAnalytics(null))
      .finally(() => setALoading(false));
  }, [range, fetchAnalytics]);

  const cards = [
    { label: "Table Reservations", value: stats.res, badge: stats.newRes, s: "reservations" as Section },
    { label: "Space Requests", value: stats.sp, badge: stats.newSp, s: "spaces" as Section },
    { label: "Menu Items", value: stats.menu, badge: 0, s: "menu" as Section },
  ];

  const maxViews = Math.max(1, ...(analytics?.series.map((s) => s.views) ?? [0]));

  return (
    <div className="space-y-8">
      {/* Live analytics summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={Activity} label="Active now" value={analytics?.activeNow ?? 0} accent hint="last 5 min" />
        <StatTile icon={Users} label="Unique visitors" value={analytics?.totalVisitors ?? 0} hint={rangeLabel(range)} />
        <StatTile icon={Eye} label="Page views" value={analytics?.totalViews ?? 0} hint={rangeLabel(range)} />
        <StatTile icon={TrendingUp} label="Bookings" value={stats.res + stats.sp} hint={`${stats.newRes + stats.newSp} new`} />
      </div>

      {/* Traffic chart */}
      <section className="border border-border bg-surface/40 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">TRAFFIC</p>
            <h2 className="font-display text-2xl uppercase">Website visitors</h2>
          </div>
          <div className="flex border border-border">
            {(["week", "month", "year"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 h-9 text-[11px] font-bold uppercase tracking-widest border-r border-border last:border-r-0 ${
                  range === r ? "bg-accent text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {r === "week" ? "7 days" : r === "month" ? "30 days" : "12 months"}
              </button>
            ))}
          </div>
        </div>
        {aLoading ? <div className="h-48 grid place-items-center"><Loader2 className="size-6 animate-spin text-accent" /></div> :
          !analytics || analytics.series.length === 0 ? <div className="h-48 grid place-items-center text-muted-foreground font-mono text-xs">NO DATA YET</div> : (
          <div>
            <div className="flex items-end gap-1 h-48">
              {analytics.series.map((s, idx) => {
                const h = Math.max(2, Math.round((s.views / maxViews) * 100));
                return (
                  <div key={idx} className="flex-1 min-w-0 group relative flex items-end">
                    <div style={{ height: `${h}%` }}
                      className="w-full bg-accent/30 hover:bg-accent transition relative">
                      <div className="absolute inset-x-0 -top-1 h-1 bg-accent opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-background border border-border px-2 py-1 text-[10px] font-mono whitespace-nowrap z-10">
                      {s.views} views · {s.visitors} visitors
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>{analytics.series[0]?.date}</span>
              <span>{analytics.series[analytics.series.length - 1]?.date}</span>
            </div>
            {analytics.topPaths.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">TOP PAGES</p>
                <div className="space-y-1.5">
                  {analytics.topPaths.map((p) => (
                    <div key={p.path} className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-muted-foreground truncate flex-1">{p.path || "/"}</span>
                      <div className="w-32 h-1.5 bg-muted">
                        <div className="h-full bg-accent" style={{ width: `${(p.views / analytics.topPaths[0].views) * 100}%` }} />
                      </div>
                      <span className="font-mono text-accent w-12 text-right">{p.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Booking cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onNav(c.s)}
            className="text-left border border-border bg-surface/40 p-6 hover:border-accent transition">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{c.label}</p>
            <div className="flex items-end justify-between">
              <span className="font-display text-5xl">{c.value}</span>
              {c.badge > 0 && <span className="bg-accent text-primary-foreground px-2 py-1 text-[10px] font-mono uppercase tracking-widest">{c.badge} new</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function rangeLabel(r: "week" | "month" | "year") {
  return r === "week" ? "past 7 days" : r === "month" ? "past 30 days" : "past 12 months";
}

function StatTile({ icon: Icon, label, value, hint, accent }: { icon: any; label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`border p-5 bg-surface/40 ${accent ? "border-accent/60" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`size-3.5 ${accent ? "text-accent" : "text-muted-foreground"}`} />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <div className={`font-display text-4xl ${accent ? "text-accent" : ""}`}>{value}</div>
      {hint && <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

/* ================= RESERVATIONS ================= */

type Reservation = {
  id: string; name: string; phone: string; email: string;
  date: string; time: string; party_size: number;
  special_requests: string | null; status: string; created_at: string;
};

function ReservationsSection() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "handled">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [waNumber, setWaNumber] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("reservations").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Reservation[]);
    const { data: s } = await supabase.from("site_settings").select("whatsapp_number").eq("id", 1).maybeSingle();
    setWaNumber(s?.whatsapp_number ?? "");
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => items.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (q) {
      const s = q.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.phone.includes(s);
    }
    return true;
  }), [items, q, statusFilter, dateFrom, dateTo]);

  if (loading) return <LoaderBlock />;
  return (
    <div className="space-y-6">
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, phone…" />
        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as any)} options={[
          { value: "all", label: "All statuses" }, { value: "new", label: "New" }, { value: "handled", label: "Handled" },
        ]} />
        <DateInput value={dateFrom} onChange={setDateFrom} label="From" />
        <DateInput value={dateTo} onChange={setDateTo} label="To" />
      </FilterBar>
      {filtered.length === 0 ? <Empty label="No reservations match." /> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <BookingCard key={r.id} name={r.name} status={r.status} created={r.created_at}
              rows={[
                { icon: Calendar, label: `${r.date} · ${r.time}` },
                { icon: Users, label: `${r.party_size} guests` },
                { icon: Mail, label: r.email },
                { icon: Phone, label: r.phone },
              ]}
              note={r.special_requests}
              waUrl={waNumber ? buildWhatsAppUrl(waNumber, formatReservationMessage(r)) : ""}
              onMark={async () => { await supabase.from("reservations").update({ status: "handled" }).eq("id", r.id); refresh(); }}
              onDelete={async () => { if (!confirm("Delete?")) return; await supabase.from("reservations").delete().eq("id", r.id); refresh(); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= SPACES ================= */

type SpaceRes = {
  id: string; name: string; phone: string; email: string;
  event_date: string; party_size: number; space: string;
  message: string | null; status: string; created_at: string;
};

function SpacesSection() {
  const [items, setItems] = useState<SpaceRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "handled">("all");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [waNumber, setWaNumber] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("space_reservations").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as SpaceRes[]);
    const { data: s } = await supabase.from("site_settings").select("whatsapp_number").eq("id", 1).maybeSingle();
    setWaNumber(s?.whatsapp_number ?? "");
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const spaces = useMemo(() => Array.from(new Set(items.map((i) => i.space))), [items]);
  const filtered = useMemo(() => items.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (spaceFilter !== "all" && r.space !== spaceFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s);
    }
    return true;
  }), [items, q, statusFilter, spaceFilter]);

  if (loading) return <LoaderBlock />;
  return (
    <div className="space-y-6">
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email…" />
        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as any)} options={[
          { value: "all", label: "All statuses" }, { value: "new", label: "New" }, { value: "handled", label: "Handled" },
        ]} />
        <Select value={spaceFilter} onChange={setSpaceFilter} options={[
          { value: "all", label: "All spaces" }, ...spaces.map((s) => ({ value: s, label: s })),
        ]} />
      </FilterBar>
      {filtered.length === 0 ? <Empty label="No requests match." /> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <BookingCard key={r.id} name={r.name} status={r.status} created={r.created_at}
              rows={[
                { icon: Calendar, label: r.event_date },
                { icon: Users, label: `${r.party_size} guests` },
                { icon: MapPin, label: r.space },
                { icon: Mail, label: r.email },
                { icon: Phone, label: r.phone },
              ]}
              note={r.message}
              waUrl={waNumber ? buildWhatsAppUrl(waNumber, formatSpaceMessage(r)) : ""}
              onMark={async () => { await supabase.from("space_reservations").update({ status: "handled" }).eq("id", r.id); refresh(); }}
              onDelete={async () => { if (!confirm("Delete?")) return; await supabase.from("space_reservations").delete().eq("id", r.id); refresh(); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= MENU CRUD ================= */

type MenuRow = {
  id: string; name: string; description: string; price: string;
  calories: number | null; category: string; tag: string | null;
  sort_order: number; active: boolean;
};

const MENU_CATEGORIES = ["Starters", "Wings", "Burgers & Mains", "Shareables", "Cocktails", "Drafts", "Desserts"];

function MenuSection() {
  const [items, setItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("menu_items").select("*").order("sort_order").order("name");
    setItems((data ?? []) as MenuRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const filtered = items.filter((i) => {
    if (catFilter !== "all" && i.category !== catFilter) return false;
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search menu…" />
        <Select value={catFilter} onChange={setCatFilter} options={[
          { value: "all", label: "All categories" }, ...MENU_CATEGORIES.map((c) => ({ value: c, label: c })),
        ]} />
        <button onClick={() => setEditing({
          id: "", name: "", description: "", price: "", calories: null,
          category: "Starters", tag: null, sort_order: 0, active: true,
        })}
          className="ml-auto inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest hover:brightness-110">
          <Plus className="size-3.5" /> Add item
        </button>
      </FilterBar>
      {loading ? <LoaderBlock /> : filtered.length === 0 ? <Empty label="No menu items." /> : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Price</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Cal</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Tag</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{i.category}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{i.price}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{i.calories ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{i.tag ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ToggleActive checked={i.active} onChange={async (v) => {
                      await supabase.from("menu_items").update({ active: v }).eq("id", i.id); refresh();
                    }} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <IconBtn label="Edit" onClick={() => setEditing(i)}><Pencil className="size-3.5" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={async () => {
                      if (!confirm("Delete?")) return;
                      await supabase.from("menu_items").delete().eq("id", i.id); refresh();
                    }}><Trash2 className="size-3.5" /></IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <MenuEditor row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function MenuEditor({ row, onClose, onSaved }: { row: MenuRow; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      description: String(fd.get("description") ?? ""),
      price: String(fd.get("price")),
      calories: fd.get("calories") ? Number(fd.get("calories")) : null,
      category: String(fd.get("category")),
      tag: (fd.get("tag") as string) || null,
      sort_order: Number(fd.get("sort_order") ?? 0),
      active: fd.get("active") === "on",
    };
    const q = row.id
      ? supabase.from("menu_items").update(payload).eq("id", row.id)
      : supabase.from("menu_items").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) { alert(error.message); return; }
    onSaved();
  };
  return (
    <Modal title={row.id ? "Edit Item" : "New Item"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Input name="name" label="Name" defaultValue={row.name} required />
        <Textarea name="description" label="Description" defaultValue={row.description} />
        <div className="grid grid-cols-2 gap-3">
          <Input name="price" label="Price (e.g. $15)" defaultValue={row.price} required />
          <Input name="calories" label="Calories" type="number" defaultValue={row.calories ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="category" label="Category" defaultValue={row.category} options={MENU_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <SelectField name="tag" label="Tag" defaultValue={row.tag ?? ""} options={[
            { value: "", label: "None" }, { value: "New", label: "New" },
            { value: "Chef's Pick", label: "Chef's Pick" }, { value: "Spicy", label: "Spicy" }, { value: "Local", label: "Local" },
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <Input name="sort_order" label="Sort order" type="number" defaultValue={row.sort_order} />
          <label className="flex items-center gap-2 h-10">
            <input type="checkbox" name="active" defaultChecked={row.active} /> Active
          </label>
        </div>
        <SaveBar busy={busy} onCancel={onClose} />
      </form>
    </Modal>
  );
}

/* ================= PARTY (spaces + shows) ================= */

type PartySpace = { id: string; name: string; capacity: string; price: string; description: string; icon: string; sort_order: number; active: boolean; };
type PartyShow = { id: string; date_label: string; time_label: string; act: string; event_type: string; genre: string; image_url: string | null; sort_order: number; active: boolean; };

function PartySection() {
  const [tab, setTab] = useState<"spaces" | "shows">("spaces");
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border">
        <SubTab active={tab === "spaces"} onClick={() => setTab("spaces")} label="Spaces" />
        <SubTab active={tab === "shows"} onClick={() => setTab("shows")} label="Shows" />
      </div>
      {tab === "spaces" ? <SpacesCrud /> : <ShowsCrud />}
    </div>
  );
}

function SpacesCrud() {
  const [rows, setRows] = useState<PartySpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PartySpace | null>(null);
  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("party_spaces").select("*").order("sort_order");
    setRows((data ?? []) as PartySpace[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ id: "", name: "", capacity: "", price: "", description: "", icon: "Users", sort_order: 0, active: true })}
        className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest">
        <Plus className="size-3.5" /> Add space
      </button>
      {loading ? <LoaderBlock /> : rows.length === 0 ? <Empty label="No spaces." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((s) => (
            <article key={s.id} className="border border-border bg-surface/40 p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display text-xl uppercase">{s.name}</h3>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 ${s.active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{s.active ? "Live" : "Hidden"}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{s.capacity} · {s.price}</p>
              <p className="text-sm mb-3">{s.description}</p>
              <div className="flex gap-2">
                <IconBtn label="Edit" onClick={() => setEditing(s)}><Pencil className="size-3.5" /></IconBtn>
                <IconBtn label="Delete" danger onClick={async () => { if (!confirm("Delete?")) return; await supabase.from("party_spaces").delete().eq("id", s.id); refresh(); }}><Trash2 className="size-3.5" /></IconBtn>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit Space" : "New Space"} onClose={() => setEditing(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              name: String(fd.get("name")), capacity: String(fd.get("capacity")),
              price: String(fd.get("price")), description: String(fd.get("description")),
              icon: String(fd.get("icon")), sort_order: Number(fd.get("sort_order") ?? 0),
              active: fd.get("active") === "on",
            };
            const q = editing.id ? supabase.from("party_spaces").update(payload).eq("id", editing.id) : supabase.from("party_spaces").insert(payload);
            const { error } = await q; if (error) alert(error.message); else { setEditing(null); refresh(); }
          }} className="space-y-4">
            <Input name="name" label="Name" defaultValue={editing.name} required />
            <Input name="capacity" label="Capacity" defaultValue={editing.capacity} required />
            <Input name="price" label="Price / min spend" defaultValue={editing.price} required />
            <Textarea name="description" label="Description" defaultValue={editing.description} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField name="icon" label="Icon (lucide)" defaultValue={editing.icon} options={[
                { value: "Users", label: "Users" }, { value: "PartyPopper", label: "Party Popper" }, { value: "Building2", label: "Building" },
                { value: "Mic2", label: "Mic" }, { value: "MapPin", label: "Pin" }, { value: "Star", label: "Star" },
              ]} />
              <Input name="sort_order" label="Sort" type="number" defaultValue={editing.sort_order} />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={editing.active} /> Active</label>
            <SaveBar busy={false} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function ShowsCrud() {
  const [rows, setRows] = useState<PartyShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PartyShow | null>(null);
  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("party_shows").select("*").order("sort_order");
    setRows((data ?? []) as PartyShow[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ id: "", date_label: "", time_label: "", act: "", event_type: "Live Band", genre: "", image_url: "", sort_order: 0, active: true })}
        className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest">
        <Plus className="size-3.5" /> Add show
      </button>
      {loading ? <LoaderBlock /> : rows.length === 0 ? <Empty label="No shows." /> : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr><th className="text-left px-4 py-3">When</th><th className="text-left px-4 py-3">Act</th><th className="text-left px-4 py-3 hidden md:table-cell">Type</th><th className="text-left px-4 py-3 hidden md:table-cell">Genre</th><th className="text-left px-4 py-3">Live</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.date_label} · {r.time_label}</td>
                  <td className="px-4 py-3 font-medium">{r.act}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.event_type}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.genre}</td>
                  <td className="px-4 py-3">
                    <ToggleActive checked={r.active} onChange={async (v) => { await supabase.from("party_shows").update({ active: v }).eq("id", r.id); refresh(); }} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <IconBtn label="Edit" onClick={() => setEditing(r)}><Pencil className="size-3.5" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={async () => { if (!confirm("Delete?")) return; await supabase.from("party_shows").delete().eq("id", r.id); refresh(); }}><Trash2 className="size-3.5" /></IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit Show" : "New Show"} onClose={() => setEditing(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              date_label: String(fd.get("date_label")), time_label: String(fd.get("time_label")),
              act: String(fd.get("act")), event_type: String(fd.get("event_type")),
              genre: String(fd.get("genre")), image_url: String(fd.get("image_url") ?? "") || null,
              sort_order: Number(fd.get("sort_order") ?? 0), active: fd.get("active") === "on",
            };
            const q = editing.id ? supabase.from("party_shows").update(payload).eq("id", editing.id) : supabase.from("party_shows").insert(payload);
            const { error } = await q; if (error) alert(error.message); else { setEditing(null); refresh(); }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="date_label" label="Date label (e.g. FRI · JUL 03)" defaultValue={editing.date_label} required />
              <Input name="time_label" label="Time label (e.g. 9:00 PM)" defaultValue={editing.time_label} required />
            </div>
            <Input name="act" label="Act" defaultValue={editing.act} required />
            <div className="grid grid-cols-2 gap-3">
              <Input name="event_type" label="Type (Live Band / DJ Set…)" defaultValue={editing.event_type} required />
              <Input name="genre" label="Genre" defaultValue={editing.genre} />
            </div>
            <Input name="image_url" label="Image URL (optional)" defaultValue={editing.image_url ?? ""} />
            <div className="grid grid-cols-2 gap-3">
              <Input name="sort_order" label="Sort" type="number" defaultValue={editing.sort_order} />
              <label className="flex items-center gap-2 h-10"><input type="checkbox" name="active" defaultChecked={editing.active} /> Active</label>
            </div>
            <SaveBar busy={false} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ================= SPORTS ================= */

type SportsRow = { id: string; league: string; when_label: string; match_label: string; note: string; sort_order: number; active: boolean; };

function SportsSection() {
  const [rows, setRows] = useState<SportsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SportsRow | null>(null);
  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("sports_schedule").select("*").order("sort_order");
    setRows((data ?? []) as SportsRow[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ id: "", league: "", when_label: "", match_label: "", note: "", sort_order: 0, active: true })}
        className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest">
        <Plus className="size-3.5" /> Add fixture
      </button>
      {loading ? <LoaderBlock /> : rows.length === 0 ? <Empty label="No fixtures." /> : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr><th className="text-left px-4 py-3">League</th><th className="text-left px-4 py-3">When</th><th className="text-left px-4 py-3">Match</th><th className="text-left px-4 py-3 hidden md:table-cell">Note</th><th className="text-left px-4 py-3">Live</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{r.league}</td>
                  <td className="px-4 py-3">{r.when_label}</td>
                  <td className="px-4 py-3 font-medium">{r.match_label}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.note}</td>
                  <td className="px-4 py-3">
                    <ToggleActive checked={r.active} onChange={async (v) => { await supabase.from("sports_schedule").update({ active: v }).eq("id", r.id); refresh(); }} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <IconBtn label="Edit" onClick={() => setEditing(r)}><Pencil className="size-3.5" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={async () => { if (!confirm("Delete?")) return; await supabase.from("sports_schedule").delete().eq("id", r.id); refresh(); }}><Trash2 className="size-3.5" /></IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit Fixture" : "New Fixture"} onClose={() => setEditing(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              league: String(fd.get("league")), when_label: String(fd.get("when_label")),
              match_label: String(fd.get("match_label")), note: String(fd.get("note") ?? ""),
              sort_order: Number(fd.get("sort_order") ?? 0), active: fd.get("active") === "on",
            };
            const q = editing.id ? supabase.from("sports_schedule").update(payload).eq("id", editing.id) : supabase.from("sports_schedule").insert(payload);
            const { error } = await q; if (error) alert(error.message); else { setEditing(null); refresh(); }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="league" label="League" defaultValue={editing.league} required />
              <Input name="when_label" label="When" defaultValue={editing.when_label} required />
            </div>
            <Input name="match_label" label="Match" defaultValue={editing.match_label} required />
            <Textarea name="note" label="Note" defaultValue={editing.note} />
            <div className="grid grid-cols-2 gap-3">
              <Input name="sort_order" label="Sort" type="number" defaultValue={editing.sort_order} />
              <label className="flex items-center gap-2 h-10"><input type="checkbox" name="active" defaultChecked={editing.active} /> Active</label>
            </div>
            <SaveBar busy={false} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ================= SETTINGS ================= */

function SettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      setWhatsapp(data?.whatsapp_number ?? "");
      setNotifyEmail(data?.notification_email ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      id: 1, whatsapp_number: whatsapp, notification_email: notifyEmail,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <LoaderBlock />;
  return (
    <div className="max-w-2xl">
      <form onSubmit={save} className="space-y-6 border border-border bg-surface/40 p-6">
        <div>
          <label className="block">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              <MessageCircle className="size-3.5" /> Admin WhatsApp Number
            </span>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+14805550123" className="w-full bg-background border border-border h-11 px-3 text-sm focus:border-accent outline-none" />
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Include country code. When customers submit a reservation, a pre-filled WhatsApp message opens to this number. Also used for the "Send to WhatsApp" button on each booking.
          </p>
        </div>
        <div>
          <label className="block">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              <Mail className="size-3.5" /> Notification Email
            </span>
            <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="admin@millsmodern.social" className="w-full bg-background border border-border h-11 px-3 text-sm focus:border-accent outline-none" />
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Displayed as the reservations contact. Email dispatch can be wired to a provider like Resend on request.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs disabled:opacity-60">
            <Save className="size-3.5" /> {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && <span className="text-xs text-accent font-mono uppercase tracking-widest">Saved</span>}
        </div>
      </form>
    </div>
  );
}

/* ================= SHARED UI ================= */

function LoaderBlock() {
  return <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-accent" /></div>;
}
function Empty({ label }: { label: string }) {
  return <div className="border border-dashed border-border p-16 text-center">
    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</p></div>;
}
function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 border border-border bg-surface/40 p-4">{children}</div>;
}
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-background border border-border h-10 pl-9 pr-3 text-sm focus:border-accent outline-none" />
    </div>
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-background border border-border h-10 px-3 text-sm focus:border-accent outline-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function DateInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="text-xs">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-background border border-border h-10 px-3 text-sm focus:border-accent outline-none" />
    </label>
  );
}
function Input({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      <input {...rest} className="w-full bg-background border border-border h-10 px-3 text-sm focus:border-accent outline-none" />
    </label>
  );
}
function Textarea({ label, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      <textarea rows={3} {...rest} className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none resize-none" />
    </label>
  );
}
function SelectField({ label, options, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      <select {...rest} className="w-full bg-background border border-border h-10 px-3 text-sm focus:border-accent outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
function IconBtn({ children, onClick, label, danger }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={label}
      className={`inline-flex items-center justify-center size-8 border border-border ml-1 hover:${danger ? "border-red-500 hover:text-red-500" : "border-accent hover:text-accent"} ${danger ? "hover:border-red-500 hover:text-red-500" : "hover:border-accent hover:text-accent"}`}>
      {children}
    </button>
  );
}
function ToggleActive({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition ${checked ? "bg-accent" : "bg-muted"}`}>
      <span className={`absolute top-0.5 size-4 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}
function SubTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-3 text-sm font-bold uppercase tracking-widest border-b-2 -mb-px transition ${active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>
  );
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface">
          <h3 className="font-display text-xl uppercase">{title}</h3>
          <button onClick={onClose} className="size-8 grid place-items-center border border-border hover:border-accent"><X className="size-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function SaveBar({ busy, onCancel }: { busy: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-5 h-10 border border-border text-xs font-bold uppercase tracking-widest hover:border-accent">Cancel</button>
      <button disabled={busy} className="ml-auto inline-flex items-center gap-2 px-5 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest disabled:opacity-60">
        <Save className="size-3.5" /> {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
function BookingCard({
  name, status, created, rows, note, onMark, onDelete, waUrl,
}: {
  name: string; status: string; created: string;
  rows: { icon: any; label: string }[]; note: string | null;
  onMark: () => void; onDelete: () => void; waUrl?: string;
}) {
  const isNew = status === "new";
  return (
    <article className={`border p-5 bg-surface/40 ${isNew ? "border-accent/60" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-2xl uppercase leading-none">{name}</h3>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{new Date(created).toLocaleString()}</p>
        </div>
        <span className={`font-mono text-[10px] px-2 py-1 tracking-widest uppercase ${isNew ? "bg-accent text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{status}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
        {rows.map((r, i) => { const I = r.icon; return (
          <div key={i} className="flex items-center gap-2 min-w-0"><I className="size-3.5 text-accent shrink-0" /><span className="truncate">{r.label}</span></div>
        );})}
      </div>
      {note && <p className="text-sm text-foreground border-l-2 border-accent pl-3 py-1 mb-3 whitespace-pre-wrap">{note}</p>}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent">
            <MessageCircle className="size-3" /> WhatsApp
          </a>
        )}
        {isNew && (
          <button onClick={onMark} className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent">
            <Check className="size-3" /> Mark handled
          </button>
        )}
        <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-red-500 hover:text-red-500 ml-auto">
          <Trash2 className="size-3" /> Delete
        </button>
      </div>
    </article>
  );
}
