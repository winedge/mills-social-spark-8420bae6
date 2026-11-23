import { createServerFn } from "@tanstack/react-start";
import { normalizeMac } from "./unifi";

type Input = { mac: string; email: string; firstName: string; lastName: string };

/**
 * Asks the venue's UniFi controller to let a guest device online.
 * Guest details are only validated here — never stored or forwarded.
 */
export const authorizeWifiGuest = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    const mac = normalizeMac(d?.mac);
    if (!mac) throw new Error("Invalid device");
    if (typeof d.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.email.length > 254) throw new Error("Invalid email");
    if (typeof d.firstName !== "string" || !d.firstName.trim() || d.firstName.length > 60) throw new Error("Invalid name");
    if (typeof d.lastName !== "string" || !d.lastName.trim() || d.lastName.length > 60) throw new Error("Invalid name");
    return { mac };
  })
  .handler(async ({ data }) => {
    const base = process.env["UNIFI_CONTROLLER_URL"]?.replace(/\/$/, "");
    const user = process.env["UNIFI_USERNAME"];
    const pass = process.env["UNIFI_PASSWORD"];
    const site = process.env["UNIFI_SITE"] || "default";
    const minutes = Number(process.env["UNIFI_GUEST_MINUTES"] || 480);
    if (!base || !user || !pass) return { ok: false as const, reason: "not_configured" as const };

    const body = JSON.stringify({ username: user, password: pass });
    const headers = { "Content-Type": "application/json" };
    // UniFi OS consoles (UDM, Cloud Key Gen2+) first, then classic controllers.
    let prefix = "/proxy/network";
    let res = await fetch(`${base}/api/auth/login`, { method: "POST", headers, body });
    if (!res.ok) {
      prefix = "";
      res = await fetch(`${base}/api/login`, { method: "POST", headers, body });
    }
    if (!res.ok) {
      console.error("UniFi login failed", res.status);
      return { ok: false as const, reason: "controller_error" as const };
    }
    const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""]).map((c) => c.split(";")[0]).join("; ");
    const csrf = res.headers.get("x-csrf-token");
    const auth = await fetch(`${base}${prefix}/api/s/${encodeURIComponent(site)}/cmd/stamgr`, {
      method: "POST",
      headers: { ...headers, Cookie: cookie, ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
      body: JSON.stringify({ cmd: "authorize-guest", mac: data.mac, minutes }),
    });
    if (!auth.ok) {
      console.error("UniFi authorize failed", auth.status);
      return { ok: false as const, reason: "controller_error" as const };
    }
    return { ok: true as const };
  });
