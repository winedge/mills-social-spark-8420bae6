import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import millsLogo from "@/assets/mills-logo.png.asset.json";

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

const menuSchema = z.object({
  cat: fallback(z.enum(categories), "All").default("All"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/menu")({
  validateSearch: zodValidator(menuSchema),
  head: () => ({
    meta: [
      { title: "Menu — Mills Modern Social" },
      {
        name: "description",
        content:
          "The full Mills Modern Social menu — starters, wings, burgers, shareables, craft cocktails and Arizona drafts in Tempe, AZ.",
      },
      { property: "og:title", content: "Menu — Mills Modern Social" },
      {
        property: "og:description",
        content: "Elevated bar food, craft cocktails, and local Arizona drafts.",
      },
    ],
  }),
  component: MenuPage,
});

type Item = {
  name: string;
  desc: string;
  price: string;
  cat: Exclude<Category, "All">;
  tag?: "New" | "Chef's Pick" | "Spicy" | "Local";
};

const items: Item[] = [
  // Starters
  { name: "Smoked Bone Marrow", desc: "Roasted marrow, charred sourdough, gremolata.", price: "$15", cat: "Starters", tag: "Chef's Pick" },
  { name: "Tempura Green Beans", desc: "Crispy beans, sriracha-honey aioli.", price: "$11", cat: "Starters" },
  { name: "Charred Street Corn", desc: "Cotija, lime, chili, cilantro.", price: "$10", cat: "Starters", tag: "Local" },
  { name: "Tuna Tartare Tacos", desc: "Ahi, avocado, ponzu, crispy wontons.", price: "$16", cat: "Starters", tag: "New" },

  // Wings
  { name: "Sticky Social Wings", desc: "Gochujang glaze, pickled radish, sesame.", price: "$16", cat: "Wings", tag: "Chef's Pick" },
  { name: "Ghost Pepper Wings", desc: "Hickory smoked, ghost glaze, ranch.", price: "$16", cat: "Wings", tag: "Spicy" },
  { name: "Classic Buffalo", desc: "Frank's, butter, blue cheese, celery.", price: "$14", cat: "Wings" },
  { name: "Lemon Pepper Dry Rub", desc: "Crispy, citrusy, served with garlic aioli.", price: "$14", cat: "Wings" },

  // Burgers
  { name: "The Mill Burger", desc: "Wagyu blend, caramelized onion, truffle aioli, brioche.", price: "$18", cat: "Burgers & Mains", tag: "Chef's Pick" },
  { name: "Tempe Smash", desc: "Double smash, American, balsamic onions, secret sauce.", price: "$16", cat: "Burgers & Mains" },
  { name: "Nashville Hot Chicken", desc: "Buttermilk fried, hot honey, pickles, brioche.", price: "$17", cat: "Burgers & Mains", tag: "Spicy" },
  { name: "Cast Iron Ribeye", desc: "12oz prime, herb butter, hand-cut fries.", price: "$38", cat: "Burgers & Mains" },

  // Shareables
  { name: "Short Rib Skins", desc: "Braised beef, chipotle crema, pickled Fresno.", price: "$16", cat: "Shareables" },
  { name: "Truffle Parm Fries", desc: "Hand cut, parmesan, herbs, garlic oil.", price: "$12", cat: "Shareables" },
  { name: "Brisket Nachos", desc: "Smoked brisket, queso, jalapeño, pico.", price: "$17", cat: "Shareables" },
  { name: "Soft Pretzel Board", desc: "Bavarian pretzels, beer cheese, mustard.", price: "$13", cat: "Shareables" },

  // Cocktails
  { name: "Desert Heat Old Fashioned", desc: "Bourbon, ancho chili, charred orange.", price: "$14", cat: "Cocktails", tag: "Chef's Pick" },
  { name: "Cobalt Mule", desc: "Vodka, blueberry, lime, house ginger beer.", price: "$13", cat: "Cocktails" },
  { name: "Smoked Paloma", desc: "Mezcal, grapefruit, lime, smoked salt rim.", price: "$14", cat: "Cocktails", tag: "New" },
  { name: "Espresso Martini", desc: "Vodka, cold brew, vanilla, salted cream.", price: "$13", cat: "Cocktails" },

  // Drafts
  { name: "Four Peaks Kilt Lifter", desc: "Scottish-style amber. Tempe local.", price: "$7", cat: "Drafts", tag: "Local" },
  { name: "Huss Scottsdale Blonde", desc: "Crisp, light, easy drinking.", price: "$7", cat: "Drafts", tag: "Local" },
  { name: "Wren House Spellbinder", desc: "Hazy IPA, juicy citrus hops.", price: "$8", cat: "Drafts", tag: "Local" },
  { name: "Guinness", desc: "The classic Irish dry stout.", price: "$8", cat: "Drafts" },

  // Desserts
  { name: "Skillet Cookie", desc: "Warm chocolate chip, vanilla bean ice cream.", price: "$10", cat: "Desserts" },
  { name: "Bourbon Bread Pudding", desc: "Brioche, caramel, candied pecans.", price: "$11", cat: "Desserts" },
];

function MenuPage() {
  const { cat, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q);

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

  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      {/* Top bar */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="Mills Modern Social — Home">
            <img src={millsLogo.url} alt="Mill's Modern Social" width={200} height={44} className="h-9 md:h-10 w-auto object-contain" />
          </Link>
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hidden md:block">
            FULL MENU · TEMPE, AZ
          </span>
          <Link
            to="/"
            className="font-mono text-xs uppercase tracking-widest hover:text-accent transition-colors"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20 pb-12 max-w-7xl mx-auto">
        <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-4">
          KITCHEN · BAR · DRAFTS
        </span>
        <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6">
          The <span className="text-accent">Menu</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-pretty">
          Elevated game-day food and craft cocktails. Filter by section or search for your
          favorite.
        </p>
      </section>

      {/* Filter bar */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 pb-1">
            {categories.map((c) => {
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() =>
                    navigate({ search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, cat: c }) })
                  }
                  className={`shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                    active
                      ? "bg-accent text-primary-foreground border-accent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="relative shrink-0">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                navigate({
                  search: (prev: z.infer<typeof menuSchema>) => ({ ...prev, q: e.target.value }),
                  replace: true,
                });
              }}
              placeholder="SEARCH ITEMS"
              className="bg-surface border border-border px-4 py-2 text-xs font-mono uppercase tracking-widest outline-none focus:border-accent w-full lg:w-72 placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {/* Menu list */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        {grouped.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono text-sm py-24">
            NO ITEMS MATCH YOUR FILTER.
          </p>
        ) : (
          <div className="space-y-20">
            {grouped.map(([section, list]) => (
              <div key={section}>
                <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-border">
                  <h2 className="font-display text-4xl uppercase">{section}</h2>
                  <span className="font-mono text-xs text-muted-foreground tracking-widest">
                    {String(list.length).padStart(2, "0")} ITEMS
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {list.map((i) => (
                    <article
                      key={i.name}
                      className="group flex items-start justify-between gap-6 pb-6 border-b border-border/60"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
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
                      <div className="font-mono text-accent text-lg shrink-0">{i.price}</div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-10 px-6 text-center">
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
          MILLS MODERN SOCIAL · 425 S MILL AVE · TEMPE, AZ
        </p>
      </footer>
    </div>
  );
}
