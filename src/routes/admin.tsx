import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  LogOut, Shield, Loader2, Mail, Phone, Calendar, Users, MapPin,
  Trash2, Check, LayoutDashboard, UtensilsCrossed, PartyPopper, Trophy,
  Settings as SettingsIcon, Menu as MenuIcon, X, Plus, Pencil, Save,
  MessageCircle, Search, ChevronRight, Sparkles, FolderTree, Eye, Activity,
  TrendingUp, Tv, CalendarClock, Upload, Briefcase,
} from "lucide-react";
import logo from "@/assets/mills-logo.png";
import { estimateCalories } from "@/lib/menu-ai.functions";
import { sendCustomerConfirmation } from "@/lib/notify.functions";
import { UfcAdminWrapper } from "@/components/admin-ufc-wrapper";
import { AdminNflSection } from "@/components/admin-nfl-section";
import { getAnalytics, type AnalyticsStats } from "@/lib/analytics.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - Mill's Modern Social" },
      { name: "description", content: "Admin panel." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Section =
  | "overview" | "reservations" | "spaces" | "menu" | "categories"
  | "party" | "sports" | "ufc" | "nfl" | "specials" | "pulse" | "marquee"
  | "messages" | "subscribers" | "contactinfo" | "settings" | "careers" | "applications";

type NavItem = { id: Section; label: string; icon: any };
type NavGroup = { label: string; icon: any; children: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "children" in e;

const NAV: NavEntry[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  {
    label: "Bookings", icon: Calendar, children: [
      { id: "reservations", label: "Table Reservations", icon: Calendar },
      { id: "spaces", label: "Space Requests", icon: MapPin },
    ],
  },
  {
    label: "Menu", icon: UtensilsCrossed, children: [
      { id: "menu", label: "Menu Items", icon: UtensilsCrossed },
      { id: "categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "Homepage", icon: Sparkles, children: [
      { id: "specials", label: "Daily Specials", icon: UtensilsCrossed },
      { id: "pulse", label: "Weekly Pulse", icon: CalendarClock },
      { id: "marquee", label: "Marquee Slider", icon: Tv },
    ],
  },
  { id: "party", label: "Party & Shows", icon: PartyPopper },
  {
    label: "Sports", icon: Trophy, children: [
      { id: "sports", label: "Big Screen Schedule", icon: Trophy },
      { id: "ufc", label: "UFC Fight Nights", icon: Tv },
      { id: "nfl", label: "NFL 2026", icon: Tv },
    ],
  },
  {
    label: "Contact", icon: Mail, children: [
      { id: "messages", label: "Contact Messages", icon: MessageCircle },
      { id: "subscribers", label: "Newsletter", icon: Mail },
      { id: "contactinfo", label: "Contact Details", icon: MapPin },
    ],
  },
  {
    label: "Careers", icon: Briefcase, children: [
      { id: "careers", label: "Job Listings", icon: Briefcase },
      { id: "applications", label: "Applications", icon: Users },
    ],
  },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const ALL_SECTIONS: NavItem[] = NAV.flatMap((e) => (isGroup(e) ? e.children : [e]));
const sectionLabel = (s: Section) => ALL_SECTIONS.find((n) => n.id === s)?.label ?? "";


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
        <img src={logo} alt="Mill's" className="h-14 mx-auto mb-6" />
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
          <img src={logo} alt="Mill's" className="h-10" />
          <button className="lg:hidden" onClick={() => setNavOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-11rem)]">
          {NAV.map((entry) => {
            if (!isGroup(entry)) {
              return (
                <NavButton key={entry.id} item={entry} active={section === entry.id}
                  onClick={() => { setSection(entry.id); setNavOpen(false); }} />
              );
            }
            const GI = entry.icon;
            const groupActive = entry.children.some((c) => c.id === section);
            return (
              <div key={entry.label} className="pt-3">
                <p className={`flex items-center gap-2 px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.25em] ${groupActive ? "text-accent" : "text-muted-foreground/70"}`}>
                  <GI className="size-3" /> {entry.label}
                </p>
                <div className="space-y-1">
                  {entry.children.map((c) => (
                    <NavButton key={c.id} item={c} active={section === c.id} nested
                      onClick={() => { setSection(c.id); setNavOpen(false); }} />
                  ))}
                </div>
              </div>
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
            <h1 className="font-display text-lg uppercase tracking-tight">{sectionLabel(section)}</h1>
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
          {section === "ufc" && <UfcAdminWrapper />}
          {section === "nfl" && <AdminNflSection />}
          {section === "messages" && <MessagesSection />}
          {section === "subscribers" && <SubscribersSection />}
          {section === "contactinfo" && <ContactInfoSection />}
          {section === "specials" && <SpecialsSection />}
          {section === "pulse" && <PulseSection />}
          {section === "marquee" && <MarqueeSection />}
          {section === "settings" && <SettingsSection />}
          {section === "careers" && <CareersSection />}
          {section === "applications" && <ApplicationsSection />}
        </main>
      </div>
    </div>
  );
}

function NavButton({ item, active, nested, onClick }: { item: NavItem; active: boolean; nested?: boolean; onClick: () => void }) {
  const I = item.icon;
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 py-2.5 text-sm font-medium uppercase tracking-wider transition ${nested ? "pl-6 pr-3" : "px-3"} ${
        active ? "bg-accent/15 text-accent border-l-2 border-accent" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border-l-2 border-transparent"
      }`}>
      <I className="size-4 shrink-0" /> <span className="truncate text-left">{item.label}</span>
    </button>
  );
}



/* ================= OVERVIEW ================= */

function Overview({ onNav }: { onNav: (s: Section) => void }) {
  const [stats, setStats] = useState({ res: 0, sp: 0, newRes: 0, newSp: 0, menu: 0, jobs: 0, apps: 0 });
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [aLoading, setALoading] = useState(true);
  const [aError, setAError] = useState<string | null>(null);

  const fetchAnalytics = useServerFn(getAnalytics);

  useEffect(() => {
    (async () => {
      const [r, s, m, j, a] = await Promise.all([
        supabase.from("reservations").select("id,status"),
        supabase.from("space_reservations").select("id,status"),
        supabase.from("menu_items").select("id"),
        supabase.from("job_listings").select("id"),
        supabase.from("job_applications").select("id,status"),
      ]);
      setStats({
        res: r.data?.length ?? 0,
        newRes: r.data?.filter((x: any) => x.status === "new").length ?? 0,
        sp: s.data?.length ?? 0,
        newSp: s.data?.filter((x: any) => x.status === "new").length ?? 0,
        menu: m.data?.length ?? 0,
        jobs: j.data?.length ?? 0,
        apps: a.data?.length ?? 0,
      });
    })();
  }, []);

  useEffect(() => {
    setALoading(true);
    setAError(null);
    fetchAnalytics({ data: { range } })
      .then((d) => setAnalytics(d))
      .catch((e: any) => {
        setAnalytics(null);
        setAError(e?.message ? `Couldn't load traffic: ${e.message}` : "Couldn't load traffic data.");
      })
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
        {aLoading ? <div className="h-56 grid place-items-center"><Loader2 className="size-6 animate-spin text-accent" /></div> :
          aError ? <div className="h-56 grid place-items-center text-center text-muted-foreground font-mono text-xs px-4">{aError}</div> :
          !analytics || analytics.series.length === 0 ? <div className="h-56 grid place-items-center text-muted-foreground font-mono text-xs">NO DATA YET</div> : (
          <div>
            <div className="flex items-center gap-4 mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 bg-accent" /> Views</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 bg-accent/35" /> Visitors</span>
              <span className="ml-auto">Peak {maxViews} views</span>
            </div>
            <div className="relative h-56 pl-10">
              {/* Y axis */}
              {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${f * 100}%`, left: 0 }}>
                  <span className="w-9 text-right font-mono text-[9px] text-muted-foreground shrink-0">{Math.round(maxViews * f)}</span>
                  <span className="flex-1 border-t border-border/50" />
                </div>
              ))}
              <div className="absolute inset-y-0 left-10 right-0 flex items-end gap-[3px]">
                {analytics.series.map((s, idx) => {
                  const hv = (s.views / maxViews) * 100;
                  const hu = (s.visitors / maxViews) * 100;
                  return (
                    <div key={idx} className="flex-1 min-w-0 group relative h-full flex items-end justify-center gap-[2px]">
                      <div className="w-1/2 bg-accent group-hover:brightness-125 transition-all"
                        style={{ height: `${Math.max(s.views > 0 ? 3 : 0.5, hv)}%` }} />
                      <div className="w-1/2 bg-accent/35 group-hover:bg-accent/60 transition-all"
                        style={{ height: `${Math.max(s.visitors > 0 ? 3 : 0.5, hu)}%` }} />
                      <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-background border border-border px-2 py-1 text-[10px] font-mono whitespace-nowrap z-10">
                        {s.date} · {s.views} views · {s.visitors} visitors
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between mt-3 pl-10 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
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

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("reservations").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Reservation[]);
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
        <BookingTable
          rows={filtered}
          kind="table"
          note={(r) => r.special_requests}
          columns={[
            { label: "Date", render: (r) => r.date },
            { label: "Time", render: (r) => r.time },
            { label: "Party", render: (r) => `${r.party_size} guests` },
          ]}
          onMark={async (id) => { await supabase.from("reservations").update({ status: "handled" }).eq("id", id); refresh(); }}
          onDelete={async (id) => { if (!confirm("Delete this reservation?")) return; await supabase.from("reservations").delete().eq("id", id); refresh(); }}
        />
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

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("space_reservations").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as SpaceRes[]);
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
        <BookingTable
          rows={filtered}
          kind="space"
          note={(r) => r.message}
          columns={[
            { label: "Event date", render: (r) => r.event_date },
            { label: "Party", render: (r) => `${r.party_size} guests` },
            { label: "Space", render: (r) => r.space },
          ]}
          onMark={async (id) => { await supabase.from("space_reservations").update({ status: "handled" }).eq("id", id); refresh(); }}
          onDelete={async (id) => { if (!confirm("Delete this request?")) return; await supabase.from("space_reservations").delete().eq("id", id); refresh(); }}
        />
      )}

    </div>
  );
}

/* ================= MENU CRUD ================= */

type MenuRow = {
  id: string; name: string; description: string; price: string;
  calories: number | null; category: string; category_id: string | null;
  tag: string | null; image_url: string | null; sort_order: number; active: boolean;
};

type CategoryRow = {
  id: string; name: string; slug: string; parent_id: string | null;
  sort_order: number; active: boolean;
};

type CatNode = CategoryRow & { children: CatNode[]; depth: number; pathLabel: string };

function buildCategoryTree(cats: CategoryRow[]): CatNode[] {
  const byId = new Map<string, CatNode>();
  cats.forEach((c) => byId.set(c.id, { ...c, children: [], depth: 0, pathLabel: c.name }));
  const roots: CatNode[] = [];
  byId.forEach((n) => {
    if (n.parent_id && byId.has(n.parent_id)) byId.get(n.parent_id)!.children.push(n);
    else roots.push(n);
  });
  const walk = (n: CatNode, d: number, parentPath: string) => {
    n.depth = d;
    n.pathLabel = parentPath ? `${parentPath} › ${n.name}` : n.name;
    n.children.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    n.children.forEach((c) => walk(c, d + 1, n.pathLabel));
  };
  roots.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  roots.forEach((r) => walk(r, 0, ""));
  return roots;
}

function flattenTree(nodes: CatNode[]): CatNode[] {
  const out: CatNode[] = [];
  const walk = (list: CatNode[]) => list.forEach((n) => { out.push(n); walk(n.children); });
  walk(nodes);
  return out;
}

function descendantIds(node: CatNode): Set<string> {
  const s = new Set<string>([node.id]);
  const walk = (n: CatNode) => n.children.forEach((c) => { s.add(c.id); walk(c); });
  walk(node);
  return s;
}

function useCategories() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("menu_categories").select("*").order("sort_order").order("name");
    setItems((data ?? []) as CategoryRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

function MenuSection() {
  const [items, setItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const { items: cats } = useCategories();
  const tree = useMemo(() => buildCategoryTree(cats), [cats]);
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const catNameById = useMemo(() => new Map(cats.map((c) => [c.id, c.name])), [cats]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("menu_items").select("*").order("sort_order").order("name");
    setItems((data ?? []) as MenuRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const filterIds = useMemo(() => {
    if (catFilter === "all") return null;
    const node = flat.find((n) => n.id === catFilter);
    return node ? descendantIds(node) : new Set([catFilter]);
  }, [catFilter, flat]);

  const filtered = items.filter((i) => {
    if (filterIds && !(i.category_id && filterIds.has(i.category_id))) return false;
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search menu…" />
        <Select value={catFilter} onChange={setCatFilter} options={[
          { value: "all", label: "All categories" },
          ...flat.map((c) => ({ value: c.id, label: `${"- ".repeat(c.depth)}${c.name}` })),
        ]} />
        <button onClick={() => setEditing({
          id: "", name: "", description: "", price: "", calories: null,
          category: "", category_id: null, tag: null, image_url: null, sort_order: 0, active: true,
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
                <th className="text-left px-4 py-3 w-16">Image</th>
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
                  <td className="px-4 py-3">
                    <div className="size-10 bg-muted border border-border overflow-hidden">
                      {i.image_url ? (
                        <img src={i.image_url} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                          N/A
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {(i.category_id && catNameById.get(i.category_id)) || i.category || "-"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{i.price}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{i.calories ?? "-"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{i.tag ?? "-"}</td>
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
      {editing && <MenuEditor row={editing} categories={flat} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function MenuEditor({ row, categories, onClose, onSaved }: { row: MenuRow; categories: CatNode[]; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [autoAi, setAutoAi] = useState(row.calories == null);
  const [form, setForm] = useState({
    name: row.name,
    description: row.description,
    price: row.price,
    calories: row.calories ?? ("" as number | ""),
    category_id: row.category_id ?? "",
    tag: row.tag ?? "",
    image_url: row.image_url ?? "",
    sort_order: row.sort_order,
    active: row.active,
  });
  const aiFn = useServerFn(estimateCalories);

  const runAi = async () => {
    if (!form.name) { alert("Enter a name first."); return; }
    setAiBusy(true);
    try {
      const catName = categories.find((c) => c.id === form.category_id)?.name ?? "";
      const { calories } = await aiFn({ data: { name: form.name, description: form.description, category: catName } });
      setForm((f) => ({ ...f, calories }));
    } catch (e: any) { alert(e?.message ?? "AI estimate failed"); }
    finally { setAiBusy(false); }
  };

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    let cal = form.calories === "" ? null : Number(form.calories);
    if (autoAi && (cal == null || cal <= 0) && form.name) {
      try {
        const catName = categories.find((c) => c.id === form.category_id)?.name ?? "";
        const r = await aiFn({ data: { name: form.name, description: form.description, category: catName } });
        cal = r.calories;
      } catch { /* keep null */ }
    }
    const catName = categories.find((c) => c.id === form.category_id)?.name ?? row.category ?? "";
    const payload: any = {
      name: form.name, description: form.description, price: form.price,
      calories: cal, category: catName, category_id: form.category_id || null,
      tag: form.tag || null, image_url: form.image_url || null,
      sort_order: Number(form.sort_order) || 0, active: form.active,
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
        <Input name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Textarea name="description" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Preview Image</label>
          <div className="flex gap-2">
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="flex-1 bg-background border border-border px-3 h-10 text-sm focus:border-accent outline-none"
            />
            <label className="shrink-0 flex items-center justify-center size-10 border border-border cursor-pointer hover:border-accent transition-colors">
              <Upload className="size-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    const ext = file.name.split(".").pop();
                    const path = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from("site_assets").upload(path, file);
                    if (error) throw error;
                    const { data: { publicUrl } } = supabase.storage.from("site_assets").getPublicUrl(path);
                    setForm((f) => ({ ...f, image_url: publicUrl }));
                  } catch (err: any) { alert(err.message); }
                  finally { setBusy(false); }
                }}
                disabled={busy}
              />
            </label>
          </div>
          {form.image_url && (
            <div className="mt-2 size-20 bg-muted border border-border overflow-hidden relative group">
              <img src={form.image_url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, image_url: "" })}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-4 text-white" />
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input name="price" label="Price (e.g. $15)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Calories</span>
            <div className="flex gap-2">
              <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value === "" ? "" : Number(e.target.value) })}
                className="flex-1 min-w-0 bg-background border border-border h-10 px-3 text-sm focus:border-accent outline-none" />
              <button type="button" onClick={runAi} disabled={aiBusy || !form.name} title="Estimate with AI"
                className="inline-flex items-center gap-1 px-3 h-10 border border-accent/60 text-accent text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-primary-foreground disabled:opacity-50">
                {aiBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} AI
              </button>
            </div>
            <label className="flex items-center gap-2 mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <input type="checkbox" checked={autoAi} onChange={(e) => setAutoAi(e.target.checked)} />
              Auto-estimate on save if empty
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="category_id" label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            options={[{ value: "", label: "- None -" }, ...categories.map((c) => ({ value: c.id, label: `${"- ".repeat(c.depth)}${c.name}` }))]} />
          <SelectField name="tag" label="Tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} options={[
            { value: "", label: "None" }, { value: "New", label: "New" },
            { value: "Chef's Pick", label: "Chef's Pick" }, { value: "Spicy", label: "Spicy" }, { value: "Local", label: "Local" },
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <Input name="sort_order" label="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <label className="flex items-center gap-2 h-10">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
        <SaveBar busy={busy} onCancel={onClose} />
      </form>
    </Modal>
  );
}

/* ================= CATEGORIES ================= */

function CategoriesSection() {
  const { items, loading, refresh } = useCategories();
  const [editing, setEditing] = useState<Partial<CategoryRow> | null>(null);
  const tree = useMemo(() => buildCategoryTree(items), [items]);
  const flat = useMemo(() => flattenTree(tree), [tree]);

  const del = async (id: string) => {
    if (!confirm("Delete this category and all its children? Menu items will be unassigned.")) return;
    await (supabase as any).from("menu_categories").delete().eq("id", id);
    refresh();
  };

  const renderNode = (n: CatNode) => (
    <li key={n.id}>
      <div className="flex items-center gap-2 py-2 border-b border-border/60">
        <div style={{ paddingLeft: n.depth * 20 }} className="flex-1 flex items-center gap-2 min-w-0">
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{n.name}</span>
          {!n.active && <span className="font-mono text-[10px] text-muted-foreground uppercase">inactive</span>}
        </div>
        <button onClick={() => setEditing({ parent_id: n.id })}
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent px-2">+ Sub</button>
        <IconBtn label="Edit" onClick={() => setEditing(n)}><Pencil className="size-3.5" /></IconBtn>
        <IconBtn label="Delete" danger onClick={() => del(n.id)}><Trash2 className="size-3.5" /></IconBtn>
      </div>
      {n.children.length > 0 && <ul>{n.children.map(renderNode)}</ul>}
    </li>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <FilterBar>
        <p className="text-xs text-muted-foreground flex-1">Organize the menu with nested categories. Sub-categories can go as deep as you need.</p>
        <button onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest hover:brightness-110">
          <Plus className="size-3.5" /> New root
        </button>
      </FilterBar>
      {loading ? <LoaderBlock /> : items.length === 0 ? <Empty label="No categories yet." /> : (
        <div className="border border-border bg-surface/40 p-4">
          <ul>{tree.map(renderNode)}</ul>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit Category" : "New Category"} onClose={() => setEditing(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            const slug = String(fd.get("slug") ?? "").trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const payload: any = {
              name, slug,
              parent_id: (fd.get("parent_id") as string) || null,
              sort_order: Number(fd.get("sort_order") ?? 0),
              active: fd.get("active") === "on",
            };
            const q = editing.id
              ? (supabase as any).from("menu_categories").update(payload).eq("id", editing.id)
              : (supabase as any).from("menu_categories").insert(payload);
            const { error } = await q;
            if (error) return alert(error.message);
            setEditing(null); refresh();
          }} className="space-y-4">
            <Input name="name" label="Name" defaultValue={editing.name ?? ""} required />
            <Input name="slug" label="Slug (optional)" defaultValue={editing.slug ?? ""} />
            <SelectField name="parent_id" label="Parent" defaultValue={editing.parent_id ?? ""}
              options={[{ value: "", label: "- Top level -" },
                ...flat.filter((c) => c.id !== editing.id).map((c) => ({ value: c.id, label: `${"- ".repeat(c.depth)}${c.name}` }))]} />
            <div className="grid grid-cols-2 gap-3">
              <Input name="sort_order" label="Sort order" type="number" defaultValue={editing.sort_order ?? 0} />
              <label className="flex items-center gap-2 h-10">
                <input type="checkbox" name="active" defaultChecked={editing.active ?? true} /> Active
              </label>
            </div>
            <SaveBar busy={false} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
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

function HeroVideoUploader() {
  const [current, setCurrent] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("site_media").select("hero_video_url").eq("id", 1).maybeSingle();
    const path = data?.hero_video_url ?? null;
    setCurrent(path);
    if (path && !path.startsWith("http")) {
      const { data: signed } = await supabase.storage.from("site-media").createSignedUrl(path, 60 * 60);
      setPreview(signed?.signedUrl ?? null);
    } else setPreview(path);
  };
  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    if (!file.type.startsWith("video/")) return setMsg("Please choose a video file.");
    setBusy(true); setMsg(null);
    const path = `hero/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, {
      cacheControl: "31536000", upsert: false, contentType: file.type,
    });
    if (upErr) { setBusy(false); return setMsg(upErr.message); }
    const { error } = await supabase.from("site_media").upsert({ id: 1, hero_video_url: path, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setMsg(error.message);
    setMsg("Hero video updated.");
    load();
  };

  const clear = async () => {
    setBusy(true);
    await supabase.from("site_media").upsert({ id: 1, hero_video_url: null, updated_at: new Date().toISOString() });
    setBusy(false); setMsg("Reverted to the default hero video."); load();
  };

  return (
    <div className="border border-border bg-surface/40 p-6 space-y-4">
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Hero Background Video
      </span>
      {preview ? (
        <video src={preview} muted loop autoPlay playsInline className="w-full max-h-56 object-cover border border-border" />
      ) : (
        <p className="text-xs text-muted-foreground">Using the default built-in hero video.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 px-6 h-11 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs cursor-pointer">
          <input type="file" accept="video/*" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          {busy ? "Uploading…" : "Upload video"}
        </label>
        {current && (
          <button type="button" onClick={clear} disabled={busy}
            className="px-5 h-11 border border-border text-xs font-bold uppercase tracking-widest hover:border-accent">
            Use default
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">MP4 or WebM, muted loop recommended. Keep it under ~30 MB for fast loading.</p>
      {msg && <p className="text-xs font-mono uppercase tracking-widest text-accent">{msg}</p>}
    </div>
  );
}

const FEATURES: { key: string; label: string; hint: string }[] = [
  { key: "beer_pong", label: "Beer Pong 3D game", hint: "The playable 3D beer pong section on the Play page." },
];

function FeatureToggles() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("site_features").select("key, enabled");
      const map: Record<string, boolean> = {};
      for (const f of FEATURES) map[f.key] = true;
      for (const r of (data ?? []) as { key: string; enabled: boolean }[]) map[r.key] = r.enabled;
      setFlags(map);
      setLoading(false);
    })();
  }, []);

  const set = async (key: string, value: boolean) => {
    setFlags((f) => ({ ...f, [key]: value }));
    const { error } = await (supabase as any)
      .from("site_features")
      .upsert({ key, enabled: value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      alert(error.message);
      setFlags((f) => ({ ...f, [key]: !value }));
    }
  };

  return (
    <div className="border border-border bg-surface/40 p-6 space-y-4">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Website Sections
      </span>
      {loading ? (
        <LoaderBlock />
      ) : (
        FEATURES.map((f) => (
          <div key={f.key} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
            <ToggleActive checked={flags[f.key] ?? true} onChange={(v) => set(f.key, v)} />
          </div>
        ))
      )}
    </div>
  );
}

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
    <div className="max-w-2xl space-y-6">
      <FeatureToggles />
      <HeroVideoUploader />
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
            Include country code. New bookings are sent here automatically from the server. Automatic delivery needs the WhatsApp API keys below to be configured; otherwise the WhatsApp button falls back to opening a pre-filled chat.
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
            Private - only admins can read this. Used as the internal reservations contact.
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

type SpecialRow = { id: string; day: string; badge: string; title: string; description: string; price: string; image_url: string | null; sort_order: number; active: boolean };

function SpecialsSection() {
  const [rows, setRows] = useState<SpecialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SpecialRow | null>(null);
  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("daily_specials").select("*").order("sort_order");
    setRows((data ?? []) as SpecialRow[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ id: "", day: "", badge: "", title: "", description: "", price: "", image_url: "", sort_order: rows.length + 1, active: true })}
        className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest">
        <Plus className="size-3.5" /> Add special
      </button>
      {loading ? <LoaderBlock /> : rows.length === 0 ? <Empty label="No daily specials." /> : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Day</th><th className="text-left px-4 py-3">Title</th><th className="text-left px-4 py-3">Badge</th><th className="text-left px-4 py-3 hidden md:table-cell">Description</th><th className="text-left px-4 py-3">Price</th><th className="text-left px-4 py-3">Live</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{r.day}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-accent">{r.badge}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.description}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.price}</td>
                  <td className="px-4 py-3"><ToggleActive checked={r.active} onChange={async (v) => { await supabase.from("daily_specials").update({ active: v }).eq("id", r.id); refresh(); }} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <IconBtn label="Edit" onClick={() => setEditing(r)}><Pencil className="size-3.5" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={async () => { if (!confirm("Delete?")) return; await supabase.from("daily_specials").delete().eq("id", r.id); refresh(); }}><Trash2 className="size-3.5" /></IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit Special" : "New Special"} onClose={() => setEditing(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              day: String(fd.get("day")), badge: String(fd.get("badge") ?? ""),
              title: String(fd.get("title")), description: String(fd.get("description") ?? ""),
              price: String(fd.get("price") ?? ""), image_url: String(fd.get("image_url") ?? "") || null,
              sort_order: Number(fd.get("sort_order") ?? 0), active: fd.get("active") === "on",
            };
            const q = editing.id ? supabase.from("daily_specials").update(payload).eq("id", editing.id) : supabase.from("daily_specials").insert(payload);
            const { error } = await q; if (error) alert(error.message); else { setEditing(null); refresh(); }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="day" label="Day (e.g. MONDAY)" defaultValue={editing.day} required />
              <Input name="badge" label="Badge (e.g. 1/2 OFF)" defaultValue={editing.badge} />
            </div>
            <Input name="title" label="Title" defaultValue={editing.title} required />
            <Textarea name="description" label="Description" defaultValue={editing.description} />
            <div className="grid grid-cols-2 gap-3">
              <Input name="price" label="Price label" defaultValue={editing.price} />
              <Input name="sort_order" label="Sort" type="number" defaultValue={editing.sort_order} />
            </div>
            <Input name="image_url" label="Image URL (optional)" defaultValue={editing.image_url ?? ""} placeholder="https://…" />
            <label className="flex items-center gap-2 h-10"><input type="checkbox" name="active" defaultChecked={editing.active} /> Active</label>
            <SaveBar busy={false} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

type PulseRow = { id: string; days_label: string; title: string; copy: string; accent: boolean; image_url: string | null; sort_order: number; active: boolean };

function PulseSection() {
  const [rows, setRows] = useState<PulseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PulseRow | null>(null);
  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("weekly_pulse").select("*").order("sort_order");
    setRows((data ?? []) as PulseRow[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ id: "", days_label: "", title: "", copy: "", accent: false, image_url: "", sort_order: rows.length + 1, active: true })}
        className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest">
        <Plus className="size-3.5" /> Add pulse item
      </button>
      {loading ? <LoaderBlock /> : rows.length === 0 ? <Empty label="No weekly pulse items." /> : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Days</th><th className="text-left px-4 py-3">Title</th><th className="text-left px-4 py-3 hidden md:table-cell">Copy</th><th className="text-left px-4 py-3">Highlight</th><th className="text-left px-4 py-3">Live</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{r.days_label}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.copy}</td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">{r.accent ? "Yes" : "No"}</td>
                  <td className="px-4 py-3"><ToggleActive checked={r.active} onChange={async (v) => { await supabase.from("weekly_pulse").update({ active: v }).eq("id", r.id); refresh(); }} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <IconBtn label="Edit" onClick={() => setEditing(r)}><Pencil className="size-3.5" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={async () => { if (!confirm("Delete?")) return; await supabase.from("weekly_pulse").delete().eq("id", r.id); refresh(); }}><Trash2 className="size-3.5" /></IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit Pulse Item" : "New Pulse Item"} onClose={() => setEditing(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              days_label: String(fd.get("days_label")), title: String(fd.get("title")),
              copy: String(fd.get("copy") ?? ""), accent: fd.get("accent") === "on",
              image_url: String(fd.get("image_url") ?? "") || null,
              sort_order: Number(fd.get("sort_order") ?? 0), active: fd.get("active") === "on",
            };
            const q = editing.id ? supabase.from("weekly_pulse").update(payload).eq("id", editing.id) : supabase.from("weekly_pulse").insert(payload);
            const { error } = await q; if (error) alert(error.message); else { setEditing(null); refresh(); }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="days_label" label="Days (e.g. MON–WED)" defaultValue={editing.days_label} required />
              <Input name="title" label="Title" defaultValue={editing.title} required />
            </div>
            <Textarea name="copy" label="Copy" defaultValue={editing.copy} />
            <Input name="image_url" label="Image URL (optional)" defaultValue={editing.image_url ?? ""} placeholder="https://…" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="sort_order" label="Sort" type="number" defaultValue={editing.sort_order} />
              <label className="flex items-center gap-2 h-10"><input type="checkbox" name="accent" defaultChecked={editing.accent} /> Highlight</label>
            </div>
            <label className="flex items-center gap-2 h-10"><input type="checkbox" name="active" defaultChecked={editing.active} /> Active</label>
            <SaveBar busy={false} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function LoaderBlock() {
  return <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-accent" /></div>;
}
function Empty({ label }: { label: string }) {
  return <div className="border border-dashed border-border p-16 text-center">
    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</p></div>;
}
function MarqueeSection() {
  const [rows, setRows] = useState<{ id: string; image_url: string; display_order: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("marquee_images").select("*").order("display_order");
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const addImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const url = String(fd.get("image_url")).trim();
    if (!url) return;
    setBusy(true);
    await supabase.from("marquee_images").insert({ image_url: url, display_order: rows.length });
    (e.target as HTMLFormElement).reset();
    setBusy(false);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this image?")) return;
    await supabase.from("marquee_images").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-surface/40 p-6">
        <h3 className="font-display text-lg uppercase mb-4">Add Slider Image</h3>
        <form onSubmit={addImage} className="flex gap-3">
          <div className="flex-1">
            <Input name="image_url" label="Local Asset Path" placeholder="/src/assets/slider/image.png" required />
          </div>
          <button disabled={busy} className="self-end h-10 px-6 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs disabled:opacity-50">
            {busy ? "Adding..." : "Add"}
          </button>
        </form>
        <p className="mt-2 text-[10px] text-muted-foreground font-mono uppercase">
          Tip: Use paths like /src/assets/slider/marquee-images.png
        </p>
      </div>

      {loading ? <LoaderBlock /> : rows.length === 0 ? <Empty label="No slider images yet." /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="group relative aspect-video border border-border bg-surface overflow-hidden">
              <img src={r.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                <button onClick={() => remove(r.id)} className="size-10 bg-red-500 text-white grid place-items-center rounded-full hover:scale-110 transition-transform">
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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



/* ================= BOOKING TABLE ================= */

function BookingTable<T extends { id: string; name: string; phone: string; email: string; status: string; created_at: string }>({
  rows, columns, kind, note, onMark, onDelete,
}: {
  rows: T[];
  columns: { label: string; render: (r: T) => React.ReactNode }[];
  kind: "table" | "space";
  note: (r: T) => string | null;
  onMark: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const send = useServerFn(sendCustomerConfirmation);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const confirmCustomer = async (r: T) => {
    setBusy(r.id); setMsg(null);
    try {
      const res = await send({ data: { kind, id: r.id } });
      if (res.sent) setMsg(`Confirmation sent to ${r.name} (${r.phone}).`);
      else if (res.fallbackUrl) {
        window.open(res.fallbackUrl, "_blank", "noopener,noreferrer");
        setMsg("Automatic sending isn't configured yet - opened WhatsApp instead.");
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Couldn't send confirmation.");
    } finally {
      setBusy(null);
      setTimeout(() => setMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-3">
      {msg && <p className="font-mono text-[11px] uppercase tracking-widest text-accent">{msg}</p>}
      <div className="border border-border bg-surface/40 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background/40">
              <Th>Guest</Th>
              {columns.map((c) => <Th key={c.label}>{c.label}</Th>)}
              <Th>Status</Th>
              <Th>Received</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isNew = r.status === "new";
              const n = note(r);
              return (
                <tr key={r.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20 align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold uppercase tracking-wide">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                    {n && <p className="mt-1 text-xs border-l-2 border-accent pl-2 text-foreground/80 max-w-[240px] whitespace-pre-wrap">{n}</p>}
                  </td>
                  {columns.map((c) => (
                    <td key={c.label} className="px-4 py-3 whitespace-nowrap text-muted-foreground">{c.render(r)}</td>
                  ))}
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] px-2 py-1 tracking-widest uppercase ${isNew ? "bg-accent text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => confirmCustomer(r)} disabled={busy === r.id}
                        title="Send WhatsApp confirmation to the customer"
                        className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent disabled:opacity-50">
                        {busy === r.id ? <Loader2 className="size-3 animate-spin" /> : <MessageCircle className="size-3" />} WhatsApp
                      </button>
                      {isNew && (
                        <button onClick={() => onMark(r.id)}
                          className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent">
                          <Check className="size-3" /> Handled
                        </button>
                      )}
                      <button onClick={() => onDelete(r.id)}
                        className="inline-flex items-center justify-center size-8 border border-border hover:border-red-500 hover:text-red-500">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}


/* ================= CONTACT INFO ================= */

type ContactInfoRow = {
  id: number;
  address_line: string;
  hours_weekday: string;
  hours_weekend: string;
  phone: string;
  email: string;
  instagram_url: string;
  x_url: string;
  tiktok_url: string;
  map_embed_url: string;
};

function ContactInfoSection() {
  const [row, setRow] = useState<ContactInfoRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (supabase as any).from("contact_info").select("*").eq("id", 1).maybeSingle()
      .then(({ data }: { data: ContactInfoRow | null }) => setRow(data));
  }, []);

  if (!row) return <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;

  const set = (k: keyof ContactInfoRow, v: string) => setRow({ ...row, [k]: v });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { id, ...rest } = row;
    const { error } = await (supabase as any).from("contact_info").update(rest).eq("id", 1);
    setBusy(false);
    setMsg(error ? error.message : "Saved - the footer and contact page are updated.");
    setTimeout(() => setMsg(null), 5000);
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4 border border-border bg-surface/40 p-6">
      <p className="text-sm text-muted-foreground">
        These details power the footer ("Come hang") and the contact page.
      </p>
      <Input label="Address" value={row.address_line} onChange={(e) => set("address_line", e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Hours (Sun–Thu)" value={row.hours_weekday} onChange={(e) => set("hours_weekday", e.target.value)} />
        <Input label="Hours (Fri–Sat)" value={row.hours_weekend} onChange={(e) => set("hours_weekend", e.target.value)} />
        <Input label="Phone" value={row.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input label="Public email" value={row.email} onChange={(e) => set("email", e.target.value)} />
        <Input label="Instagram URL" value={row.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
        <Input label="X / Twitter URL" value={row.x_url} onChange={(e) => set("x_url", e.target.value)} />
        <Input label="TikTok URL" value={row.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} />
      </div>
      <Textarea label="Google Maps embed URL" rows={3} value={row.map_embed_url} onChange={(e) => set("map_embed_url", e.target.value)} />
      {msg && <p className="font-mono text-[11px] uppercase tracking-widest text-accent">{msg}</p>}
      <button disabled={busy} className="inline-flex items-center gap-2 px-5 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest disabled:opacity-60">
        <Save className="size-3.5" /> {busy ? "Saving…" : "Save contact details"}
      </button>
    </form>
  );
}

/* ================= CONTACT MESSAGES ================= */

type MessageRow = {
  id: string; name: string; email: string; phone: string;
  subject: string; message: string; status: string; created_at: string;
};

function MessagesSection() {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("contact_messages").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as MessageRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const mark = async (id: string) => {
    await (supabase as any).from("contact_messages").update({ status: "handled" }).eq("id", id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "handled" } : x)));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await (supabase as any).from("contact_messages").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return `${r.name} ${r.email} ${r.subject} ${r.message}`.toLowerCase().includes(t);
  });

  if (loading) return <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email or message…" />
        <Select value={status} onChange={setStatus} options={[
          { value: "all", label: "All statuses" },
          { value: "new", label: "New" },
          { value: "handled", label: "Handled" },
        ]} />
      </FilterBar>
      {filtered.length === 0 ? <Empty label="No messages yet" /> : (
        <div className="border border-border bg-surface/40 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background/40">
                <Th>From</Th><Th>Subject</Th><Th>Message</Th><Th>Status</Th><Th>Received</Th><Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20 align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold uppercase tracking-wide">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                    {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.subject || "-"}</td>
                  <td className="px-4 py-3 max-w-[320px] whitespace-pre-wrap text-foreground/80">{r.message}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] px-2 py-1 tracking-widest uppercase ${r.status === "new" ? "bg-accent text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent">
                        <Mail className="size-3" /> Reply
                      </a>
                      {r.status === "new" && (
                        <button onClick={() => mark(r.id)} className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent">
                          <Check className="size-3" /> Handled
                        </button>
                      )}
                      <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-red-500 hover:text-red-500">
                        <Trash2 className="size-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================= NEWSLETTER SUBSCRIBERS ================= */

type SubscriberRow = { id: string; email: string; source: string; created_at: string };

function SubscribersSection() {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (supabase as any).from("newsletter_subscribers").select("*").order("created_at", { ascending: false })
      .then(({ data }: { data: SubscriberRow[] | null }) => { setRows(data ?? []); setLoading(false); });
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    await (supabase as any).from("newsletter_subscribers").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const copyAll = () => {
    navigator.clipboard?.writeText(rows.map((r) => r.email).join(", "));
  };

  const filtered = rows.filter((r) => r.email.toLowerCase().includes(q.trim().toLowerCase()));

  if (loading) return <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search email…" />
        <button onClick={copyAll} className="px-4 h-10 border border-border text-[10px] font-bold uppercase tracking-widest hover:border-accent">
          Copy all ({rows.length})
        </button>
      </FilterBar>
      {filtered.length === 0 ? <Empty label="No subscribers yet" /> : (
        <div className="border border-border bg-surface/40 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background/40">
                <Th>Email</Th><Th>Source</Th><Th>Joined</Th><Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{r.source}</td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border border-border hover:border-red-500 hover:text-red-500">
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================= CAREERS ================= */

function CareersSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("job_listings").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      department: String(fd.get("department")),
      type: String(fd.get("type")),
      location: String(fd.get("location")),
      description: String(fd.get("description")),
      is_active: fd.get("is_active") === "on",
    };

    if (editing?.id) {
      await supabase.from("job_listings").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("job_listings").insert(payload);
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job listing?")) return;
    await supabase.from("job_listings").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rows.length} Listings</p>
        <button onClick={() => setEditing({ is_active: true })} className="flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
          <Plus className="size-3" /> New Listing
        </button>
      </div>

      {editing && (
        <div className="border border-accent/40 bg-accent/5 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-accent/20 pb-4 mb-4">
             <h3 className="font-display text-xl uppercase">{editing.id ? "Edit" : "New"} Job Listing</h3>
             <button onClick={() => setEditing(null)}><X className="size-4" /></button>
          </div>
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Input name="title" label="Job Title" defaultValue={editing.title} required /></div>
            <Input name="department" label="Department" defaultValue={editing.department} />
            <Input name="type" label="Type (Full-time, Part-time)" defaultValue={editing.type} />
            <Input name="location" label="Location" defaultValue={editing.location} />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="is_active" id="is_active" defaultChecked={editing.is_active} className="accent-accent" />
              <label htmlFor="is_active" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Active / Visible</label>
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Description</label>
              <textarea name="description" rows={5} defaultValue={editing.description} className="w-full bg-background border border-border p-3 text-sm focus:border-accent outline-none transition-colors" />
            </div>
            <div className="md:col-span-2 pt-4 flex gap-2">
              <button type="submit" className="flex items-center gap-2 px-6 h-11 bg-accent text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
                <Save className="size-3" /> Save Listing
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-6 h-11 border border-border text-[10px] font-bold uppercase tracking-widest">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {rows.map((r) => (
          <div key={r.id} className={`p-6 border bg-surface/40 flex flex-wrap items-start justify-between gap-4 ${r.is_active ? "border-border" : "border-dashed opacity-60"}`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-display text-2xl uppercase tracking-tight">{r.title}</h4>
                {!r.is_active && <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5">INACTIVE</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                <span>{r.department}</span>
                <span>{r.type}</span>
                <span>{r.location}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(r)} className="p-2 border border-border hover:border-accent hover:text-accent transition-colors"><Pencil className="size-4" /></button>
              <button onClick={() => remove(r.id)} className="p-2 border border-border hover:border-red-500 hover:text-red-500 transition-colors"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationsSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("job_applications").select("*, job_listings(title)").order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("job_applications").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("job_applications").delete().eq("id", id);
    load();
  };

  const filtered = rows.filter(r => filter === "all" || r.status === filter);

  if (loading) return <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">{filtered.length} Applications</p>
        <div className="flex border border-border">
          {["all", "pending", "reviewed", "rejected"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 h-9 text-[10px] font-bold uppercase tracking-widest border-r border-border last:border-r-0 ${filter === f ? "bg-accent text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <Empty label="No applications yet" /> : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="border border-border bg-surface/40 overflow-hidden">
               <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-8">
                  <div>
                    <p className="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">{r.job_listings?.title || "Deleted Position"}</p>
                    <h4 className="font-display text-2xl uppercase mb-1">{r.full_name}</h4>
                    <div className="space-y-1">
                      <a href={`mailto:${r.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent"><Mail className="size-3" /> {r.email}</a>
                      <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent"><Phone className="size-3" /> {r.phone}</a>
                    </div>
                    {r.resume_url && (
                       <a href={r.resume_url} target="_blank" rel="noopener" className="inline-block mt-4 px-4 py-2 border border-accent text-accent font-mono text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-colors">View Resume</a>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Message / Cover Letter</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed italic">{r.cover_letter || "No message provided."}</p>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                       <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2">Status: <span className="text-accent">{r.status}</span></p>
                       <div className="flex gap-1">
                          <button onClick={() => updateStatus(r.id, "reviewed")} title="Mark Reviewed" className="p-2 border border-border hover:bg-accent hover:text-white transition-colors"><Check className="size-4" /></button>
                          <button onClick={() => updateStatus(r.id, "rejected")} title="Reject" className="p-2 border border-border hover:bg-red-500 hover:text-white transition-colors"><X className="size-4" /></button>
                          <button onClick={() => remove(r.id)} title="Delete" className="p-2 border border-border hover:bg-red-600 hover:text-white transition-colors"><Trash2 className="size-4" /></button>
                       </div>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground mt-4">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
