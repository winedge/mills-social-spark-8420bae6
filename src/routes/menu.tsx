import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useMenuItems, useMenuCategories, useDailySpecials, type DbMenuCategory } from "@/lib/content";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const calorieRanges = [
  { id: "all", label: "All Calories", min: 0, max: Infinity },
  { id: "light", label: "Under 300", min: 0, max: 299 },
  { id: "mid", label: "300 – 600", min: 300, max: 600 },
  { id: "hearty", label: "600 – 900", min: 600, max: 900 },
  { id: "indulgent", label: "900+", min: 900, max: Infinity },
] as const;

type CalId = (typeof calorieRanges)[number]["id"];
const calIds = calorieRanges.map((c) => c.id) as [CalId, ...CalId[]];

const menuSchema = z.object({
  catId: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
  cal: fallback(z.enum(calIds), "all").default("all"),
});

export const Route = createFileRoute("/menu")({
  validateSearch: zodValidator(menuSchema),
  head: () => ({
    meta: [
      { title: "Menu - Mills Modern Social" },
      { name: "description", content: "The full Mills Modern Social menu - starters, wings, burgers, shareables, craft cocktails and Arizona drafts in Tempe, AZ." },
      { property: "og:title", content: "Menu - Mills Modern Social" },
      { property: "og:description", content: "Elevated bar food, craft cocktails, and local Arizona drafts." },
    ],
  }),
  component: MenuPage,
});

type TreeNode = DbMenuCategory & { children: TreeNode[]; depth: number };

function buildTree(cats: DbMenuCategory[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  cats.forEach((c) => byId.set(c.id, { ...c, children: [], depth: 0 }));
  const roots: TreeNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      const parent = byId.get(node.parent_id)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Recompute depth via BFS to be safe when parents processed after children
  const walk = (n: TreeNode, d: number) => {
    n.depth = d;
    n.children.forEach((c) => walk(c, d + 1));
  };
  roots.forEach((r) => walk(r, 0));
  return roots;
}

function collectDescendantIds(node: TreeNode): Set<string> {
  const set = new Set<string>([node.id]);
  const walk = (n: TreeNode) => {
    n.children.forEach((c) => {
      set.add(c.id);
      walk(c);
    });
  };
  walk(node);
  return set;
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function MenuPage() {
  const { catId, q, cal } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { items: dbItems } = useMenuItems();
  const { items: cats } = useMenuCategories();

  const tree = useMemo(() => buildTree(cats), [cats]);
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    cats.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);

  const activeCal = calorieRanges.find((r) => r.id === cal) ?? calorieRanges[0];

  const selectedIds = useMemo(() => {
    if (!catId) return null;
    const node = findNode(tree, catId);
    return node ? collectDescendantIds(node) : new Set([catId]);
  }, [catId, tree]);

  const filtered = useMemo(() => {
    return dbItems.filter((i) => {
      const inCat = !selectedIds || (i.category_id && selectedIds.has(i.category_id));
      const inQ =
        !query ||
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase());
      const c = i.calories ?? 0;
      const inCal = c >= activeCal.min && c <= activeCal.max;
      return inCat && inQ && inCal;
    });
  }, [dbItems, selectedIds, query, activeCal]);

  const catOrder = useMemo(() => {
    const m = new Map<string, number>();
    let i = 0;
    const walk = (n: TreeNode) => {
      m.set(n.id, i++);
      n.children.forEach(walk);
    };
    tree.forEach(walk);
    return m;
  }, [tree]);

  const grouped = useMemo(() => {
    const g = new Map<string, { items: typeof filtered; order: number; id: string }>();
    for (const i of filtered) {
      const label = (i.category_id && nameById.get(i.category_id)) || i.category || "Other";
      const order = (i.category_id ? catOrder.get(i.category_id) : undefined) ?? Number.MAX_SAFE_INTEGER;
      if (!g.has(label)) g.set(label, { items: [], order, id: i.category_id || "" });
      g.get(label)!.items.push(i);
    }
    return Array.from(g.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([label, v]) => [v.id, label, v.items] as [string, string, typeof filtered]);
  }, [filtered, nameById, catOrder]);


  const counts = useMemo(() => {
    const m = new Map<string, number>();
    // For each category node, count items where item's category_id is in its descendant set
    const walk = (n: TreeNode) => {
      const set = collectDescendantIds(n);
      let c = 0;
      for (const it of dbItems) if (it.category_id && set.has(it.category_id)) c++;
      m.set(n.id, c);
      n.children.forEach(walk);
    };
    tree.forEach(walk);
    return m;
  }, [tree, dbItems]);

  function setCat(id: string) {
    navigate({ search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, catId: id }) });
  }
  function setCal(id: CalId) {
    navigate({ search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, cal: id }) });
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const activeName = catId ? nameById.get(catId) ?? "All" : "All";

  const renderNode = (node: TreeNode) => {
    const active = catId === node.id;
    const hasChildren = node.children.length > 0;
    const open = expanded.has(node.id) || active || node.children.some((c) => c.id === catId);
    return (
      <li key={node.id}>
        <div className={`flex items-center gap-1 group`}>
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              aria-label={open ? "Collapse" : "Expand"}
              className="p-1.5 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}
          <button
            onClick={() => setCat(node.id)}
            className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest border transition ${
              active
                ? "bg-accent text-primary-foreground border-accent"
                : "border-border/60 text-foreground hover:border-accent/60"
            }`}
          >
            <span className="truncate">{node.name}</span>
            <span className={`font-mono text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {counts.get(node.id) ?? 0}
            </span>
          </button>
        </div>
        {hasChildren && open && (
          <ul className="mt-1 ml-4 pl-3 border-l border-border/50 space-y-1">
            {node.children.map(renderNode)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader showTicker={false} />

      {/* Hero */}
      <section className="px-6 pt-14 md:pt-20 pb-8 md:pb-12 max-w-7xl mx-auto">
        <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-4">
          KITCHEN · BAR · DRAFTS
        </span>
        <h1 className="font-display text-5xl md:text-8xl uppercase leading-[0.9] mb-6">
          The <span className="text-accent">Menu</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-pretty">
          Elevated game-day food and craft cocktails. Browse by category or search for your favorite.
        </p>

        {/* Happy Hour emphasis panel */}
        <div className="mt-8 md:mt-10 relative overflow-hidden rounded-lg border border-accent/40 bg-card/60">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-accent/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-accent/[0.05] blur-3xl" />
          <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
          <div className="relative grid gap-6 p-5 md:p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
            {/* Price tokens */}
            <div className="flex items-center gap-2 md:gap-3">
              {["6", "9", "12"].map((p, i) => (
                <div key={p} className="flex items-center gap-2 md:gap-3">
                  {i > 0 && <span className="text-accent/50 text-xl leading-none">·</span>}
                  <div className="flex items-baseline rounded-md border border-accent/50 bg-accent/10 px-2.5 py-1.5 md:px-3.5 md:py-2">
                    <span className="font-mono text-accent text-xs md:text-sm">$</span>
                    <span className="font-display text-accent text-3xl md:text-5xl leading-none">
                      {p}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Headline */}
            <div className="min-w-0">
              <h2 className="font-display uppercase text-2xl md:text-4xl leading-[0.95]">
                Happy Hour <span className="text-accent">Specials</span>
              </h2>
              <p className="font-mono text-[11px] md:text-xs tracking-[0.22em] uppercase text-muted-foreground mt-2">
                Every day 3PM - 7PM
                <span className="mx-2 text-accent">//</span>
                Dine-in only
              </p>
            </div>

            {/* New item flag */}
            <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1 md:text-right">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent animate-pulse">
                !!! New !!!
              </span>
              <span className="font-display uppercase text-lg md:text-xl leading-none">
                Loaded Street Fries
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* Sticky filter bar */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-y border-border">
        <div className="md:hidden max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                navigate({
                  search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, q: e.target.value }),
                  replace: true,
                });
              }}
              placeholder="Search menu…"
              className="bg-surface border border-border pl-9 pr-9 h-11 w-full text-sm outline-none focus:border-accent placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  navigate({
                    search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, q: "" }),
                    replace: true,
                  });
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="shrink-0 h-11 px-4 border border-border bg-surface flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:border-accent"
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">{activeName}</span>
                <span className="sm:hidden">Filter</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="!top-auto !bottom-0 !z-[90] h-[min(40rem,85vh)] rounded-t-2xl border-t border-accent/20 bg-background/95 backdrop-blur-xl data-[state=open]:sheet-anim-in data-[state=closed]:sheet-anim-out [&_[data-radix-dialog-overlay]]:hidden overflow-y-auto pb-0 md:h-auto md:max-h-[85vh]"
            >
              <style>{`
                body:has([role="dialog"][data-state="open"]) nav[aria-label="Primary"] {
                  opacity: 0;
                  transform: translateY(110%);
                  pointer-events: none;
                  transition: opacity 180ms ease, transform 240ms var(--ease-out-expo);
                }
              `}</style>
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-foreground/20" />
              <SheetHeader>
                <SheetTitle className="font-display text-2xl uppercase text-left">Filters</SheetTitle>
              </SheetHeader>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] text-muted-foreground tracking-widest">CATEGORY</div>
                  {catId && (
                    <button
                      onClick={() => setCat("")}
                      className="font-mono text-[10px] text-accent uppercase tracking-widest"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setCat("")}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest border mb-2 ${
                    !catId ? "bg-accent text-primary-foreground border-accent" : "border-border/60"
                  }`}
                >
                  <span>All items</span>
                  <span className={`font-mono text-[10px] ${!catId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {dbItems.length}
                  </span>
                </button>
                <ul className="space-y-1">{tree.map(renderNode)}</ul>
              </div>

              <div className="mt-6">
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">CALORIES</div>
                <div className="grid grid-cols-2 gap-2">
                  {calorieRanges.map((r) => {
                    const active = cal === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setCal(r.id)}
                        className={`min-h-12 px-4 text-xs font-bold uppercase tracking-widest border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          active
                            ? "bg-accent text-primary-foreground border-accent shadow-[0_0_20px_-4px] shadow-accent/60"
                            : "border-border text-foreground hover:border-accent/50"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sticky bottom-0 -mx-6 mt-6 px-6 pt-4 pb-4 bg-background/95 border-t border-border/70 shadow-[0_-18px_28px_-22px] shadow-accent/40 backdrop-blur-xl">
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-full h-12 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition"
                >
                  Show {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop command grid */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="border border-border bg-surface/30">
              {/* Header / search row */}
              <div className="grid grid-cols-12 border-b border-border">
                <div className="col-span-3 border-r border-border p-3 bg-surface/40">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    System // Filter
                  </span>
                  <h2 className="font-display text-xl uppercase tracking-tight text-foreground">Menu Explorer</h2>
                </div>
                <div className="col-span-9 relative flex items-center px-4 bg-background/40">
                  <span className="font-mono text-[10px] text-accent mr-3 shrink-0">SEARCH_QUERY &gt;</span>
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      navigate({
                        search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, q: e.target.value }),
                        replace: true,
                      });
                    }}
                    placeholder="FIND AN ITEM..."
                    className="bg-transparent border-none outline-none w-full text-sm uppercase tracking-wider text-foreground placeholder:text-muted-foreground/50 py-3"
                  />
                  <div className="flex gap-1 shrink-0 ml-3">
                    <span className="w-1 h-1 bg-border" />
                    <span className="w-1 h-1 bg-border" />
                    <span className="w-1 h-1 bg-accent" />
                  </div>
                </div>
              </div>

              {/* Category grid - no scroll */}
              <div
                className="grid border-b border-border"
                style={{ gridTemplateColumns: `repeat(${tree.length + 1}, minmax(0,1fr))` }}
              >
                {[{ id: "", name: "All", count: dbItems.length }, ...tree.map((n) => ({ id: n.id, name: n.name, count: counts.get(n.id) ?? 0 }))].map(
                  (c, idx, arr) => {
                    const active = c.id === "" ? !catId : catId === c.id || (findNode(tree, catId) != null && catId === c.id);
                    return (
                      <button
                        key={c.id || "all"}
                        onClick={() => setCat(c.id)}
                        className={`relative group flex flex-col items-start p-4 text-left transition-colors ${
                          idx < arr.length - 1 ? "border-r border-border" : ""
                        } ${active ? "bg-surface border-b-2 border-b-accent" : "hover:bg-surface/60 border-b-2 border-b-transparent"}`}
                      >
                        <span className={`absolute top-2 right-2 font-mono text-[9px] ${active ? "text-accent" : "text-muted-foreground/70"}`}>
                          [ {String(c.count).padStart(2, "0")} ]
                        </span>
                        <span className={`font-mono text-[10px] mb-1 ${active ? "text-accent/60" : "text-muted-foreground/60"}`}>
                          CAT_{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`font-display text-lg uppercase tracking-tight leading-[0.95] ${
                            active ? "text-accent" : "text-foreground/80 group-hover:text-foreground"
                          }`}
                        >
                          {c.name}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {/* Calorie range bar */}
              <div className="grid grid-cols-12">
                <div className="col-span-3 border-r border-border px-4 py-2 flex items-center justify-between bg-background/40">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">CAL_ENERGY_RANGE</span>
                  <span className="flex gap-[2px]">
                    <span className="w-1 h-3 bg-accent/20" />
                    <span className="w-1 h-3 bg-accent/40" />
                    <span className="w-1 h-3 bg-accent/60" />
                  </span>
                </div>
                <div className="col-span-9 flex">
                  {calorieRanges.map((r, i) => {
                    const active = cal === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setCal(r.id)}
                        className={`flex-1 py-2 font-mono text-[11px] uppercase transition-colors ${
                          i < calorieRanges.length - 1 ? "border-r border-border" : ""
                        } ${active ? "bg-accent text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground hover:bg-surface/60"}`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <DailySpecialsStrip />



      {/* Menu list */}
      <section className="px-4 md:px-6 py-12 md:py-16 max-w-7xl mx-auto">
        {grouped.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono text-sm py-24">
            NO ITEMS MATCH YOUR FILTER.
          </p>
        ) : (
          <div className="space-y-16 md:space-y-20">
            {grouped.map(([id, section, list]) => (
              <div key={section} id={id ? `menu-section-${id}` : undefined}>
                <div className="flex items-baseline justify-between mb-6 md:mb-8 pb-4 border-b border-border">
                  <h2 className="font-display text-3xl md:text-4xl uppercase">{section}</h2>
                  <span className="font-mono text-xs text-muted-foreground tracking-widest">
                    {String(list.length).padStart(2, "0")} ITEMS
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-6 md:gap-y-8">
                  {list.map((i) => (
                    <article
                      key={i.id}
                      className="group grid grid-cols-[1fr_auto] items-start gap-4 pb-6 border-b border-border/60"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-display text-xl uppercase tracking-wide group-hover:text-accent transition-colors">
                            {i.name}
                          </h3>
                          {i.tag && (
                            <span
                              className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border ${
                                i.tag === "Spicy"
                                  ? "border-red-500/40 text-red-400"
                                  : i.tag === "New"
                                  ? "border-accent text-accent"
                                  : "border-foreground/20 text-muted-foreground"
                              }`}
                            >
                              {i.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground text-pretty">{i.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="font-mono text-accent text-lg">{i.price}</div>
                        {i.calories != null && i.calories > 0 && (
                          <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                            {i.calories} CAL
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function DailySpecialsStrip() {
  const specials = useDailySpecials();
  if (specials.length === 0) return null;
  return (
    <section className="border-b border-border bg-card/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-border">
          <h2 className="font-display text-3xl md:text-4xl uppercase">Daily Specials</h2>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">EVERY WEEK</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specials.map((s) => (
            <article key={s.id} className="group border border-border bg-background p-5 hover:border-accent/60 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] tracking-widest text-accent uppercase">{s.day}</span>
                {s.badge && (
                  <span className="font-mono text-[10px] tracking-widest border border-border px-2 py-0.5 text-muted-foreground uppercase">
                    {s.badge}
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl uppercase mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.description}</p>
              <div className="font-mono text-accent text-lg">{s.price}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
