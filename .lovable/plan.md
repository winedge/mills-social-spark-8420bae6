# Beer Cup Preloader

Add a fun animated preloader shown while route content loads.

## What it does
- On every route navigation (including initial load), an overlay appears with a beer cup filling GIF
- Overlay hides as soon as the target route finishes loading
- Dark themed backdrop matching the site (blur + dark surface, accent glow)

## Implementation

**1. Generate the GIF asset**
- Use imagegen to create a looping animation frame set of a pint glass filling with golden beer and foam head, then render/export as an animated GIF (or animated WebP fallback)
- Upload via `lovable-assets` → `src/assets/beer-preloader.gif.asset.json`
- Transparent background so it sits cleanly over the dark overlay

**2. Create `src/components/route-preloader.tsx`**
- Subscribes to router state via `useRouterState({ select: (s) => s.status })`
- Shows a fixed full-screen overlay when `status === "pending"`
- Renders the beer GIF centered with a small "Pouring…" caption in the display font
- Fades in/out using existing `overlay-anim-in` / `overlay-anim-out` utilities from `styles.css`
- Uses `role="status"` + `aria-live="polite"` for accessibility

**3. Mount in `src/routes/__root.tsx`**
- Add `<RoutePreloader />` inside `RootComponent`, above `<MobileBottomNav />`
- No changes to route definitions needed — TanStack Router's pending state covers navigations

## Notes
- Duration = "until page is ready" — no artificial minimum, so fast loads flash briefly. If you'd like a minimum visible time later (e.g. 400ms), it's a one-line tweak.
- z-index above header (which uses z-[70]) and bottom nav — use `z-[90]`
