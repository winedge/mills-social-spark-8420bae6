import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RangeInput = z.object({
  range: z.enum(["week", "month", "year"]).default("week"),
});

export type AnalyticsStats = {
  activeNow: number;
  totalVisitors: number;
  totalViews: number;
  series: { date: string; visitors: number; views: number }[];
  topPaths: { path: string; views: number }[];
};

export const getAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RangeInput.parse(raw))
  .handler(async ({ data, context }): Promise<AnalyticsStats> => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const now = Date.now();
    const days = data.range === "week" ? 7 : data.range === "month" ? 30 : 365;
    const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
    const activeSince = new Date(now - 5 * 60 * 1000).toISOString();

    const [rowsRes, activeRes] = await Promise.all([
      supabase
        .from("page_views")
        .select("path, session_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(50000),
      supabase
        .from("page_views")
        .select("session_id")
        .gte("created_at", activeSince),
    ]);

    const rows = rowsRes.data ?? [];
    const activeRows = activeRes.data ?? [];

    // Bucket by day (or week/month for larger ranges)
    const bucket = data.range === "year" ? "month" : "day";
    const buckets = new Map<string, { visitors: Set<string>; views: number }>();
    const pathCounts = new Map<string, number>();
    const uniqueVisitors = new Set<string>();

    for (const r of rows) {
      const d = new Date(r.created_at);
      const key =
        bucket === "month"
          ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
          : d.toISOString().slice(0, 10);
      let b = buckets.get(key);
      if (!b) {
        b = { visitors: new Set(), views: 0 };
        buckets.set(key, b);
      }
      b.visitors.add(r.session_id);
      b.views += 1;
      uniqueVisitors.add(r.session_id);
      pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1);
    }

    // Fill missing buckets so charts are continuous
    const series: { date: string; visitors: number; views: number }[] = [];
    if (bucket === "month") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCMonth(d.getUTCMonth() - i, 1);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        const b = buckets.get(key);
        series.push({ date: key, visitors: b?.visitors.size ?? 0, views: b?.views ?? 0 });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        const b = buckets.get(key);
        series.push({ date: key, visitors: b?.visitors.size ?? 0, views: b?.views ?? 0 });
      }
    }

    const topPaths = Array.from(pathCounts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const activeNow = new Set(activeRows.map((r) => r.session_id)).size;

    return {
      activeNow,
      totalVisitors: uniqueVisitors.size,
      totalViews: rows.length,
      series,
      topPaths,
    };
  });
