import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "mm_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function AnalyticsTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return; // don't count admin visits
    const session_id = getSessionId();
    const payload = {
      path: pathname,
      session_id,
      user_agent: navigator.userAgent.slice(0, 500),
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
    };
    supabase.from("page_views").insert(payload).then(() => {}, () => {});
  }, [pathname]);

  return null;
}
