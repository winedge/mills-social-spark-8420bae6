## New pages for Mills Modern Social

Add four dedicated routes with matching nav links in the header. Each page gets its own SEO `head()` (title, description, og:title/description) and reuses the existing dark theme + sky-blue accent tokens.

### 1. `/play` — Play
Route: `src/routes/play.tsx`
Hero band: "Play the House" with subtitle about the game floor in Tempe.
Four feature sections as large cards, each with icon, tagline, blurb, and a "what's inside" bullet list:
- **Pool Tables** — multiple regulation tables, walk-in + reservable
- **Darts** — electronic + steel-tip lanes, league nights
- **Board Games** — curated library, free to play with any order
- **Arcade** — retro cabinets + modern racing/shooters
Include a "House Rules & Hours" strip and a CTA linking to `/party` for private game-floor bookings.

### 2. `/party` — Party
Route: `src/routes/party.tsx`
Hero: "Host it at Mills." Left column = space options (Bar Lounge, Game Floor Buyout, Full Venue) with capacity + starting-at info. Right column = contact/reservation form.

Form fields (client-side only, zod-validated, submit shows a success toast — no backend yet):
name, email, phone, event date, party size, space preference (select), message.
Uses existing `Form`, `Input`, `Textarea`, `Select`, `Button`, `sonner` toast. All fields validated (length limits, email format, trimmed).

### 3. `/sports` — Sports
Route: `src/routes/sports.tsx`
Hero: "Every game. Every night." Three programming pillars as cards:
- **UFC + Boxing** — PPV nights, sound-on main event screen
- **MLB** — every game, dedicated screens per matchup
- **FIFA World Cup 2026** — full tournament coverage, group-stage watch parties
Reuse the existing `UfcSection` (from `index.tsx`, extracted into `src/components/ufc-section.tsx`) so live UFC data + countdown appear here too. Add a "Big Screen Schedule" grid (static curated list for MLB + FIFA) and a "Reserve a table for game day" CTA to `/party`.

### 4. `/menu` — Mobile-friendly refresh
Edit existing `src/routes/menu.tsx`. Keep URL-state filters. Improvements:
- On mobile (`< md`): sticky top filter bar with horizontal scroll chips (`overflow-x-auto snap-x`) instead of wrap.
- Search input sticky under the header on mobile with a clear (×) button.
- Floating "Filters" FAB that opens a `Sheet` (bottom drawer) with full category list + count per category — one-tap access from anywhere on the page.
- Larger tap targets (min-h-11), 1-column card layout on mobile, 2-col md, 3-col lg.
- Category chip active state uses accent color; unselected muted.

### Shared updates
- Extract the current header nav from `index.tsx` into `src/components/site-header.tsx` and reuse across all pages (Home, Play, Party, Sports, Menu). Active link uses `activeProps` with the sky-blue accent underline.
- Extract `UfcSection` + `NextEventCountdown` into `src/components/ufc-section.tsx` so both `/` and `/sports` render it without duplication.
- Add matching footer component (`src/components/site-footer.tsx`) with address, hours, socials — reused on all pages.

### Technical notes
- All routes are public leaves under `src/routes/`; `createFileRoute("/play")`, `/party`, `/sports`.
- Each route's `head()` sets unique title/description/og tags. No `og:image` on root; add per-page only if a real hero image URL is available.
- Party form is presentational (no DB); if you later want submissions stored/emailed, we'll enable Lovable Cloud and add a server function + table.
- No new dependencies required — `zod`, `react-hook-form`, shadcn `Sheet`, `Select`, `Textarea`, `sonner` are already installed.
