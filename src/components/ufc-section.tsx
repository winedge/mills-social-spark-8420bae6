import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUfcFights, type UfcEvent } from "@/lib/ufc.functions";

const streamedQueryOptions = queryOptions({
  queryKey: ["ufc", "streamed"],
  queryFn: async () => {
    const { data } = await supabase.from("ufc_streamed_events").select("event_id");
    return ((data ?? []) as { event_id: number }[]).map((r) => Number(r.event_id));
  },
  staleTime: 60_000,
});

export const ufcQueryOptions = queryOptions({
  queryKey: ["ufc", "fights"],
  queryFn: () => getUfcFights(),
  staleTime: 60_000,

});

function formatFightDate(iso: string | null) {
  if (!iso) return "TBD";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(d.getTime())) return "TBD";
  return d
    .toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase();
}

type Fight = UfcEvent["fights"][number];

function norm(v: string | null | undefined) {
  return String(v ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function decided(f: Fight) {
  return Boolean(f.fighterA?.winner || f.fighterB?.winner) || norm(f.status) === "final";
}

function fightWinnerLabel(f: Fight) {
  const w = f.fighterA?.winner ? f.fighterA : f.fighterB?.winner ? f.fighterB : null;
  const loser = f.fighterA?.winner ? f.fighterB : f.fighterA;
  if (!w) return null;
  const how = f.resultType ? f.resultType.toUpperCase() : f.resultRound ? "FINISH" : "DEC";
  const rd = f.resultRound ? ` R${f.resultRound}` : "";
  return `${w.name.toUpperCase()} def. ${(loser?.name || "TBD").toUpperCase()} · ${how}${rd}`;
}

function LiveResults({ event }: { event: UfcEvent }) {
  const byOrder = [...event.fights].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const finished = byOrder.filter(decided);
  const pending = byOrder.filter((f) => !decided(f) && f.fighterA && f.fighterB);
  // Cards run from the highest bout order (prelims) down to order 1 (main event),
  // so the next undecided bout is the one with the highest order.
  const inProgress = pending.length ? pending[pending.length - 1] : null;
  if (!inProgress && finished.length === 0) return null;

  return (
    <div className="border-t border-border pt-3 flex flex-col gap-2">
      <div className="font-mono text-[10px] text-red-500 tracking-widest flex items-center gap-1.5">
        <span className="size-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE RESULTS
      </div>
      {inProgress && (
        <div className="bg-red-500/10 border border-red-500/30 px-3 py-2">
          <div className="font-mono text-[9px] text-red-400 tracking-widest mb-0.5">IN THE OCTAGON</div>
          <div className="font-display text-sm uppercase leading-tight">
            {inProgress.fighterA?.name || "TBD"} <span className="text-accent">VS</span>{" "}
            {inProgress.fighterB?.name || "TBD"}
          </div>
          {inProgress.weightClass && (
            <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
              {inProgress.weightClass.toUpperCase()}
            </div>
          )}
        </div>
      )}
      {finished.slice(0, 4).map((f) => (
        <div key={f.fightId} className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xs uppercase text-accent truncate">
            {fightWinnerLabel(f)}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground whitespace-nowrap">
            {f.weightClass ? f.weightClass.toUpperCase() : "FINAL"}
          </span>
        </div>
      ))}
      {finished.length > 4 && (
        <div className="font-mono text-[9px] text-muted-foreground tracking-widest">
          +{finished.length - 4} MORE BOUTS DECIDED
        </div>
      )}
    </div>
  );
}

function UndercardPreview({ event }: { event: UfcEvent }) {
  const byOrder = [...event.fights].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const bouts = byOrder
    .slice(1)
    .filter((f) => f.fighterA?.name && f.fighterB?.name)
    .slice(0, 4);
  if (bouts.length === 0) return null;
  return (
    <div className="border-t border-border pt-3 flex flex-col gap-2">
      <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
        ALSO ON THE CARD
      </div>
      {bouts.map((f) => (
        <div key={f.fightId} className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xs uppercase truncate">
            {f.fighterA?.name} <span className="text-accent">vs</span> {f.fighterB?.name}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground whitespace-nowrap">
            {f.weightClass ? f.weightClass.toUpperCase() : `R${f.rounds ?? 3}`}
          </span>
        </div>
      ))}
      {byOrder.length - 1 > bouts.length && (
        <div className="font-mono text-[9px] text-muted-foreground tracking-widest">
          +{byOrder.length - 1 - bouts.length} MORE BOUTS
        </div>
      )}
    </div>
  );
}

function EventCard({ event, live }: { event: UfcEvent; live?: boolean }) {
  const main = event.mainEvent;
  const a = main?.fighterA;
  const b = main?.fighterB;
  const isFinal = norm(event.status) === "final";
  return (
    <article className={`h-full bg-background border p-4 sm:p-6 flex flex-col gap-4 group transition-colors ${live ? "border-red-500/40 hover:border-red-500/70" : "border-border hover:border-accent/50"}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="font-display text-base sm:text-lg uppercase truncate">{event.name}</div>
          <div className="font-mono text-[10px] text-accent tracking-widest mt-1 truncate">
            {main?.weightClass || "UFC"} · MAIN EVENT
          </div>
        </div>
        {live ? (
          <span className="shrink-0 flex items-center gap-1.5 font-mono text-[10px] text-red-500 tracking-widest">
            <span className="size-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground tracking-widest text-right max-w-[42%] sm:max-w-none sm:whitespace-nowrap">
            {isFinal ? "FINAL" : formatFightDate(event.dateTime)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 my-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative group/fighter">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover/fighter:bg-accent/30 transition-colors" />
            <div className="relative size-20 md:size-24 rounded-full border-2 border-border overflow-hidden bg-surface flex items-center justify-center">
              {a?.imageUrl ? (
                <img 
                  src={a.imageUrl} 
                  alt={a.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    // If thumb fails, try high-res as a backup
                    const target = e.currentTarget;
                    if (target.src.includes('/thumbs/')) {
                      target.src = target.src.replace('/thumbs/', '/');
                    } else {
                      target.style.display = 'none';
                      target.parentElement?.querySelector('.fallback-initial')?.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`fallback-initial font-display text-2xl text-muted-foreground/30 ${a?.imageUrl ? 'hidden' : ''}`}>
                {a?.name?.charAt(0) || "?"}
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className={`font-display text-sm sm:text-lg uppercase leading-tight truncate px-1 ${a?.winner ? "text-accent" : ""}`}>
              {a?.name || "TBD"}
            </div>
            {a && (a.wins !== null || a.losses !== null) && (
              <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                {a.wins ?? 0}-{a.losses ?? 0}-{a.draws ?? 0}
              </div>
            )}
          </div>
        </div>

        <div className="font-display text-accent text-xl sm:text-2xl shrink-0 italic tracking-tighter self-center mb-6">VS</div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative group/fighter">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover/fighter:bg-accent/30 transition-colors" />
            <div className="relative size-20 md:size-24 rounded-full border-2 border-border overflow-hidden bg-surface flex items-center justify-center">
              {b?.imageUrl ? (
                <img 
                  src={b.imageUrl} 
                  alt={b.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('/thumbs/')) {
                      target.src = target.src.replace('/thumbs/', '/');
                    } else {
                      target.style.display = 'none';
                      target.parentElement?.querySelector('.fallback-initial')?.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`fallback-initial font-display text-2xl text-muted-foreground/30 ${b?.imageUrl ? 'hidden' : ''}`}>
                {b?.name?.charAt(0) || "?"}
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className={`font-display text-sm sm:text-lg uppercase leading-tight truncate px-1 ${b?.winner ? "text-accent" : ""}`}>
              {b?.name || "TBD"}
            </div>
            {b && (b.wins !== null || b.losses !== null) && (
              <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                {b.wins ?? 0}-{b.losses ?? 0}-{b.draws ?? 0}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {live || isFinal ? <LiveResults event={event} /> : <UndercardPreview event={event} />}
      </div>

      <div className="font-mono text-[10px] text-muted-foreground tracking-widest border-t border-border pt-3 flex flex-wrap gap-x-3 gap-y-1 justify-between mt-auto">
        <span>
          {main?.resultType
            ? `${main.resultType.toUpperCase()} · R${main.resultRound ?? "-"}`
            : `BEST OF ${main?.rounds ?? 5} ROUNDS`}
        </span>
        <span>{event.fights.length} FIGHTS</span>
      </div>
    </article>
  );
}


function useCountdown(iso: string | null) {
  const target = iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime() : null;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target || now === null) return null;
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function NextEventCountdown({ event, isLive }: { event: UfcEvent; isLive?: boolean }) {
  const c = useCountdown(event.dateTime);
  const started = isLive || (c !== null && c.d + c.h + c.m + c.s === 0);
  if (!c && !started) return null;
  const parts = c
    ? [
        { v: c.d, l: "DAYS" },
        { v: c.h, l: "HRS" },
        { v: c.m, l: "MIN" },
        { v: c.s, l: "SEC" },
      ]
    : [];
  return (
    <div
      className={`border p-6 mb-10 ${started ? "border-red-500/40 bg-red-500/5" : "border-accent/30 bg-accent/5"}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div
            className={`font-mono text-[10px] tracking-widest mb-1 ${started ? "text-red-500" : "text-accent"}`}
          >
            {started ? "FIGHT NIGHT · UNDERWAY" : "NEXT FIGHT NIGHT · COUNTDOWN"}
          </div>
          <div className="font-display text-2xl md:text-3xl uppercase leading-tight">
            {event.name}
          </div>
        </div>
        {started ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="size-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="font-display text-3xl md:text-4xl text-red-500 uppercase">
              Live Now
            </span>
          </div>
        ) : (
          <div className="flex gap-4">
            {parts.map((p) => (
              <div key={p.l} className="text-center min-w-[52px]">
                <div className="font-display text-3xl md:text-4xl text-accent tabular-nums">
                  {String(p.v).padStart(2, "0")}
                </div>
                <div className="font-mono text-[9px] text-muted-foreground tracking-widest">
                  {p.l}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function UfcSection() {
  const { data, dataUpdatedAt, isFetching } = useSuspenseQuery(ufcQueryOptions);
  const { data: streamedIds, isPending: streamedPending } = useQuery(streamedQueryOptions);
  const allow = new Set(streamedIds ?? []);
  const keep = (e: UfcEvent) => allow.has(e.eventId);
  const live = (data.live ?? []).filter(keep);
  const upcoming = (data.upcoming ?? []).filter(keep);
  const recent = (data.recent ?? []).filter(keep);
  const featured = [...live, ...upcoming, ...recent].slice(0, 6);
  const nextEvent = live[0] ?? upcoming[0] ?? null;
  const [updated, setUpdated] = useState<string>("");
  useEffect(() => {
    setUpdated(
      new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
        timeZone: "America/Phoenix",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, [dataUpdatedAt]);

  return (
    <section id="ufc" className="py-24 px-6 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">
              OCTAGON HQ · POWERED BY SPORTSDATAIO
            </span>
            <h3 className="font-display text-5xl md:text-6xl uppercase mb-4">
              UFC <span className="text-accent">fight nights</span>
            </h3>
            <p className="text-muted-foreground text-pretty">
              Every card, every main event - live at Mills. Grab a booth, order a
              round, and watch the octagon on the loudest screens in Tempe.
            </p>
          </div>
          <div className="flex gap-6 font-mono text-[10px] tracking-widest">
            <div>
              <div className="text-muted-foreground">LIVE</div>
              <div className="text-accent text-2xl font-display">{live.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">UPCOMING</div>
              <div className="text-2xl font-display">{upcoming.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">RECENT</div>
              <div className="text-2xl font-display">{recent.length}</div>
            </div>
          </div>
        </div>

        {updated && (
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-widest mb-6">
            <span className={`size-1.5 rounded-full ${isFetching ? "bg-accent animate-pulse" : "bg-accent/50"}`} />
            LAST UPDATE {updated} MST
          </div>
        )}


        {nextEvent && (
          <NextEventCountdown
            event={nextEvent}
            isLive={live.some((l) => l.eventId === nextEvent.eventId)}
          />
        )}

        {!data.configured && (
          <div className="border border-accent/40 bg-accent/5 p-6 font-mono text-xs text-muted-foreground">
            UFC feed not configured yet. Add your SportsDataIO MMA API key to see live fights here.
          </div>
        )}

        {data.configured && streamedPending && featured.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 border border-border bg-background/60 animate-pulse" />
            ))}
          </div>
        )}

        {data.configured && !streamedPending && featured.length === 0 && (
          <div className="border border-border p-8 font-mono text-xs text-muted-foreground text-center">
            {(data as { error?: string }).error
              ? "Live fight data is temporarily unavailable - check back shortly."
              : "No fight nights announced yet. Check back soon for the next card showing at Mills."}
          </div>
        )}


        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((evt) => (
              <EventCard
                key={evt.eventId}
                event={evt}
                live={live.some((l) => l.eventId === evt.eventId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
