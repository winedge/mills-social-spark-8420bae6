import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useMenuItems } from "@/lib/content";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const categories = [
  "All",
  "Starters",
  "Wings",
  "Burgers & Mains",
  "Shareables",
  "Cocktails",
  "Drafts",
  "Desserts",
] as const;

type Category = (typeof categories)[number];

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
  cat: fallback(z.enum(categories), "All").default("All"),
  q: fallback(z.string(), "").default(""),
  cal: fallback(z.enum(calIds), "all").default("all"),
});

export const Route = createFileRoute("/menu")({
  validateSearch: zodValidator(menuSchema),
  head: () => ({
    meta: [
      { title: "Menu — Mills Modern Social" },
      { name: "description", content: "The full Mills Modern Social menu — starters, wings, burgers, shareables, craft cocktails and Arizona drafts in Tempe, AZ." },
      { property: "og:title", content: "Menu — Mills Modern Social" },
      { property: "og:description", content: "Elevated bar food, craft cocktails, and local Arizona drafts." },
    ],
  }),
  component: MenuPage,
});

type Item = {
  name: string;
  desc: string;
  price: string;
  cal: number;
  cat: Exclude<Category, "All">;
  tag?: string | null;
};


function MenuPage() {
  const { cat, q, cal } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { items: dbItems, loading } = useMenuItems();

  const items: Item[] = useMemo(
    () =>
      dbItems.map((i) => ({
        name: i.name,
        desc: i.description,
        price: i.price,
        cal: i.calories ?? 0,
        cat: (categories.includes(i.category as Category) ? i.category : "Starters") as Exclude<Category, "All">,
        tag: i.tag,
      })),
    [dbItems],
  );

  const activeCal = calorieRanges.find((r) => r.id === cal) ?? calorieRanges[0];

  const counts = useMemo(() => {
    const m = new Map<Category, number>();
    m.set("All", items.length);
    for (const i of items) m.set(i.cat, (m.get(i.cat) ?? 0) + 1);
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const inCat = cat === "All" || i.cat === cat;
      const inQ =
        !query ||
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.desc.toLowerCase().includes(query.toLowerCase());
      const inCal = i.cal >= activeCal.min && i.cal <= activeCal.max;
      return inCat && inQ && inCal;
    });
  }, [cat, query, activeCal, items]);

  const grouped = useMemo(() => {
    const g = new Map<string, Item[]>();
    for (const i of filtered) {
      if (!g.has(i.cat)) g.set(i.cat, []);
      g.get(i.cat)!.push(i);
    }
    return Array.from(g.entries());
  }, [filtered]);

  function setCat(c: Category) {
    navigate({ search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, cat: c }) });
  }

  function setCal(id: CalId) {
    navigate({ search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, cal: id }) });
  }

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
          Elevated game-day food and craft cocktails. Filter by section or search for your favorite.
        </p>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2">
          {/* Search */}
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

          {/* Mobile filter FAB */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="md:hidden shrink-0 h-11 px-4 border border-border bg-surface flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:border-accent"
              >
                <SlidersHorizontal className="size-4" />
                {cat === "All" ? "Filter" : cat}
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
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">SECTION</div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((c, idx) => {
                    const active = cat === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className={`animate-chip-in min-h-12 px-4 text-xs font-bold uppercase tracking-widest border flex items-center justify-between gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          active
                            ? "bg-accent text-primary-foreground border-accent shadow-[0_0_20px_-4px] shadow-accent/60"
                            : "border-border text-foreground hover:border-accent/50"
                        }`}
                      >
                        <span>{c}</span>
                        <span className={`font-mono text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {counts.get(c) ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">CALORIES</div>
                <div className="grid grid-cols-2 gap-2">
                  {calorieRanges.map((r, idx) => {
                    const active = cal === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setCal(r.id)}
                        style={{ animationDelay: `${(idx + categories.length) * 40}ms` }}
                        className={`animate-chip-in min-h-12 px-4 text-xs font-bold uppercase tracking-widest border transition-all hover:scale-[1.02] active:scale-[0.98] ${
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

        {/* Desktop chip row */}
        <div className="hidden md:block border-t border-border">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto items-center">
            {categories.map((c) => {
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 px-4 h-10 text-xs font-bold uppercase tracking-widest border transition-colors ${
                    active
                      ? "bg-accent text-primary-foreground border-accent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                  }`}
                >
                  {c}
                  <span className={`ml-2 font-mono text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                    {counts.get(c) ?? 0}
                  </span>
                </button>
              );
            })}
            <div className="mx-2 h-6 w-px bg-border shrink-0" />
            {calorieRanges.map((r) => {
              const active = cal === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setCal(r.id)}
                  className={`shrink-0 px-4 h-10 text-xs font-bold uppercase tracking-widest border transition-colors ${
                    active
                      ? "bg-accent text-primary-foreground border-accent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Menu list */}
      <section className="px-4 md:px-6 py-12 md:py-16 max-w-7xl mx-auto">
        {grouped.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono text-sm py-24">
            NO ITEMS MATCH YOUR FILTER.
          </p>
        ) : (
          <div className="space-y-16 md:space-y-20">
            {grouped.map(([section, list]) => (
              <div key={section}>
                <div className="flex items-baseline justify-between mb-6 md:mb-8 pb-4 border-b border-border">
                  <h2 className="font-display text-3xl md:text-4xl uppercase">{section}</h2>
                  <span className="font-mono text-xs text-muted-foreground tracking-widest">
                    {String(list.length).padStart(2, "0")} ITEMS
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-6 md:gap-y-8">
                  {list.map((i) => (
                    <article
                      key={i.name}
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
                        <p className="text-sm text-muted-foreground text-pretty">{i.desc}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="font-mono text-accent text-lg">{i.price}</div>
                        <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                          {i.cal} CAL
                        </div>
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
