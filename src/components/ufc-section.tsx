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
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
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

function EventCard({ event, live }: { event: UfcEvent; live?: boolean }) {
  const main = event.mainEvent;
  const a = main?.fighterA;
  const b = main?.fighterB;
  const isFinal = event.status.toLowerCase() === "final";
  return (
    <article className="bg-background border border-border p-6 flex flex-col gap-4 group hover:border-accent/50 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="font-display text-lg uppercase truncate">{event.name}</div>
          <div className="font-mono text-[10px] text-accent tracking-widest mt-1">
            {main?.weightClass || "UFC"} · MAIN EVENT
          </div>
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-red-500 tracking-widest">
            <span className="size-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest whitespace-nowrap">
            {isFinal ? "FINAL" : formatFightDate(event.dateTime)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 my-2">
        <div className="text-right">
          <div className={`font-display text-xl uppercase leading-tight ${a?.winner ? "text-accent" : ""}`}>
            {a?.name || "TBD"}
          </div>
          {a && (a.wins !== null || a.losses !== null) && (
            <div className="font-mono text-[10px] text-muted-foreground mt-1">
              {a.wins ?? 0}-{a.losses ?? 0}-{a.draws ?? 0}
            </div>
          )}
        </div>
        <div className="font-display text-accent text-lg">VS</div>
        <div className="text-left">
          <div className={`font-display text-xl uppercase leading-tight ${b?.winner ? "text-accent" : ""}`}>
            {b?.name || "TBD"}
          </div>
          {b && (b.wins !== null || b.losses !== null) && (
            <div className="font-mono text-[10px] text-muted-foreground mt-1">
              {b.wins ?? 0}-{b.losses ?? 0}-{b.draws ?? 0}
            </div>
          )}
        </div>
      </div>

      <div className="font-mono text-[10px] text-muted-foreground tracking-widest border-t border-border pt-3 flex justify-between">
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

function NextEventCountdown({ event }: { event: UfcEvent }) {
  const c = useCountdown(event.dateTime);
  if (!c) return null;
  const parts = [
    { v: c.d, l: "DAYS" },
    { v: c.h, l: "HRS" },
    { v: c.m, l: "MIN" },
    { v: c.s, l: "SEC" },
  ];
  return (
    <div className="border border-accent/30 bg-accent/5 p-6 mb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-accent tracking-widest mb-1">
            NEXT FIGHT NIGHT · COUNTDOWN
          </div>
          <div className="font-display text-2xl md:text-3xl uppercase leading-tight">
            {event.name}
          </div>
        </div>
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
      </div>
    </div>
  );
}

export function UfcSection() {
  const { data, dataUpdatedAt, isFetching } = useSuspenseQuery(ufcQueryOptions);
  const { data: streamedIds } = useQuery(streamedQueryOptions);
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

        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-widest mb-6">
          <span className={`size-1.5 rounded-full ${isFetching ? "bg-accent animate-pulse" : "bg-accent/50"}`} />
          AUTO-REFRESH · EVERY 60s{updated ? ` · LAST UPDATE ${updated} MST` : ""}
        </div>

        {nextEvent && <NextEventCountdown event={nextEvent} />}

        {!data.configured && (
          <div className="border border-accent/40 bg-accent/5 p-6 font-mono text-xs text-muted-foreground">
            UFC feed not configured yet. Add your SportsDataIO MMA API key to see live fights here.
          </div>
        )}

        {data.configured && featured.length === 0 && (
          <div className="border border-border p-8 font-mono text-xs text-muted-foreground text-center">
            No fight nights announced yet. Check back soon for the next card showing at Mills.
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
