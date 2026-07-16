import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
  tag?: "New" | "Chef's Pick" | "Spicy" | "Local";
};

const items: Item[] = [
  { name: "Smoked Bone Marrow", desc: "Roasted marrow, charred sourdough, gremolata.", price: "$15", cal: 620, cat: "Starters", tag: "Chef's Pick" },
  { name: "Tempura Green Beans", desc: "Crispy beans, sriracha-honey aioli.", price: "$11", cal: 480, cat: "Starters" },
  { name: "Charred Street Corn", desc: "Cotija, lime, chili, cilantro.", price: "$10", cal: 340, cat: "Starters", tag: "Local" },
  { name: "Tuna Tartare Tacos", desc: "Ahi, avocado, ponzu, crispy wontons.", price: "$16", cal: 410, cat: "Starters", tag: "New" },
  { name: "Sticky Social Wings", desc: "Gochujang glaze, pickled radish, sesame.", price: "$16", cal: 780, cat: "Wings", tag: "Chef's Pick" },
  { name: "Ghost Pepper Wings", desc: "Hickory smoked, ghost glaze, ranch.", price: "$16", cal: 820, cat: "Wings", tag: "Spicy" },
  { name: "Classic Buffalo", desc: "Frank's, butter, blue cheese, celery.", price: "$14", cal: 750, cat: "Wings" },
  { name: "Lemon Pepper Dry Rub", desc: "Crispy, citrusy, served with garlic aioli.", price: "$14", cal: 690, cat: "Wings" },
  { name: "The Mill Burger", desc: "Wagyu blend, caramelized onion, truffle aioli, brioche.", price: "$18", cal: 980, cat: "Burgers & Mains", tag: "Chef's Pick" },
  { name: "Tempe Smash", desc: "Double smash, American, balsamic onions, secret sauce.", price: "$16", cal: 890, cat: "Burgers & Mains" },
  { name: "Nashville Hot Chicken", desc: "Buttermilk fried, hot honey, pickles, brioche.", price: "$17", cal: 920, cat: "Burgers & Mains", tag: "Spicy" },
  { name: "Cast Iron Ribeye", desc: "12oz prime, herb butter, hand-cut fries.", price: "$38", cal: 1180, cat: "Burgers & Mains" },
  { name: "Short Rib Skins", desc: "Braised beef, chipotle crema, pickled Fresno.", price: "$16", cal: 860, cat: "Shareables" },
  { name: "Truffle Parm Fries", desc: "Hand cut, parmesan, herbs, garlic oil.", price: "$12", cal: 640, cat: "Shareables" },
  { name: "Brisket Nachos", desc: "Smoked brisket, queso, jalapeño, pico.", price: "$17", cal: 1050, cat: "Shareables" },
  { name: "Soft Pretzel Board", desc: "Bavarian pretzels, beer cheese, mustard.", price: "$13", cal: 720, cat: "Shareables" },
  { name: "Desert Heat Old Fashioned", desc: "Bourbon, ancho chili, charred orange.", price: "$14", cal: 220, cat: "Cocktails", tag: "Chef's Pick" },
  { name: "Cobalt Mule", desc: "Vodka, blueberry, lime, house ginger beer.", price: "$13", cal: 190, cat: "Cocktails" },
  { name: "Smoked Paloma", desc: "Mezcal, grapefruit, lime, smoked salt rim.", price: "$14", cal: 210, cat: "Cocktails", tag: "New" },
  { name: "Espresso Martini", desc: "Vodka, cold brew, vanilla, salted cream.", price: "$13", cal: 250, cat: "Cocktails" },
  { name: "Four Peaks Kilt Lifter", desc: "Scottish-style amber. Tempe local.", price: "$7", cal: 210, cat: "Drafts", tag: "Local" },
  { name: "Huss Scottsdale Blonde", desc: "Crisp, light, easy drinking.", price: "$7", cal: 170, cat: "Drafts", tag: "Local" },
  { name: "Wren House Spellbinder", desc: "Hazy IPA, juicy citrus hops.", price: "$8", cal: 230, cat: "Drafts", tag: "Local" },
  { name: "Guinness", desc: "The classic Irish dry stout.", price: "$8", cal: 210, cat: "Drafts" },
  { name: "Skillet Cookie", desc: "Warm chocolate chip, vanilla bean ice cream.", price: "$10", cal: 890, cat: "Desserts" },
  { name: "Bourbon Bread Pudding", desc: "Brioche, caramel, candied pecans.", price: "$11", cal: 760, cat: "Desserts" },
];

function MenuPage() {
  const { cat, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q);
  const [sheetOpen, setSheetOpen] = useState(false);

  const counts = useMemo(() => {
    const m = new Map<Category, number>();
    m.set("All", items.length);
    for (const i of items) m.set(i.cat, (m.get(i.cat) ?? 0) + 1);
    return m;
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const inCat = cat === "All" || i.cat === cat;
      const inQ =
        !query ||
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.desc.toLowerCase().includes(query.toLowerCase());
      return inCat && inQ;
    });
  }, [cat, query]);

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
    setSheetOpen(false);
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
              <button className="md:hidden shrink-0 h-11 px-4 border border-border bg-surface flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:border-accent">
                <SlidersHorizontal className="size-4" />
                {cat === "All" ? "Filter" : cat}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl border-t border-accent/20 bg-background/95 backdrop-blur-xl data-[state=open]:sheet-anim-in data-[state=closed]:sheet-anim-out [&_[data-radix-dialog-overlay]]:hidden"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-foreground/20" />
              <SheetHeader>
                <SheetTitle className="font-display text-2xl uppercase text-left">Filter by section</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 mt-4 pb-4">
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
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop chip row */}
        <div className="hidden md:block border-t border-border">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
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
