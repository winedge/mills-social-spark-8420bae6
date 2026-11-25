import { useEffect, useState, type FormEvent } from "react";
import { checkWifiAccess } from "@/lib/wifi-access.functions";
import { getGuestPortalStatus, signInGuestWifi } from "@/lib/unifi-guest.functions";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Info, Mail, ShieldCheck, Wifi } from "lucide-react";
import millsLogo from "@/assets/mills-logo.png.asset.json";
import venuePhoto from "@/assets/hero-bar.jpg";
import { Button } from "@/components/ui/button";
import { useWifiSettings } from "@/lib/wifi-settings";

export const Route = createFileRoute("/wifi")({
  head: () => ({
    meta: [
      { title: "Guest Wi-Fi | Mill's Modern Social" },
      {
        name: "description",
        content: "Guest Wi-Fi sign-in and privacy information for Mill's Modern Social in Tempe, Arizona.",
      },
      { property: "og:title", content: "Guest Wi-Fi | Mill's Modern Social" },
      {
        property: "og:description",
        content: "Connect at Mill's Modern Social in Tempe and review guest Wi-Fi privacy information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: GuestWifiPage,
});

function GuestWifiPage() {
  const signIn = useServerFn(signInGuestWifi);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState({ mac: "", ap: "" });
  const [message, setMessage] = useState("");
  const settings = useWifiSettings();
  const [onNetwork, setOnNetwork] = useState<boolean | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDevice({ mac: params.get("id") ?? "", ap: params.get("ap") ?? "" });
    // Device identifiers must not remain in browser history or referrer URLs.
    window.history.replaceState(null, "", window.location.pathname);
    checkWifiAccess().then((r) => setOnNetwork(r.active && r.allowed)).catch(() => setOnNetwork(false));
    getGuestPortalStatus().then((s) => setReady(s.ready)).catch(() => setReady(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onNetwork === false) {
      setMessage("Please connect to the Mills guest Wi-Fi network first, then try again.");
      return;
    }
    if (!ready || !device.mac || !device.ap) { setMessage("Join the restaurant guest Wi-Fi and open the sign-in page shown by your device. Your details were not saved."); return; }
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setMessage("");
    try {
      await signIn({ data: { firstName: String(values.get("firstName") ?? "").trim(), lastName: String(values.get("lastName") ?? "").trim(), email: String(values.get("email") ?? "").trim(), ...device } });
      setConnected(true); form.reset(); setMessage("You’re connected. Enjoy your time at Mills!");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not confirm internet access. Please ask a Mills team member."); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_35rem]">
      <section className="relative isolate flex min-h-[230px] items-end justify-center overflow-hidden text-center px-6 pb-7 pt-8 sm:px-10 lg:min-h-svh lg:px-14 lg:pb-14 lg:pt-12">
        <img
          src={venuePhoto}
          alt="Inside Mill's Modern Social"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/65 to-background/25 lg:bg-gradient-to-r lg:from-background/80 lg:via-background/30 lg:to-background/20" />
        <nav aria-label="Mills website" className="absolute inset-x-0 top-0 flex justify-center gap-2 p-4">
          {([["/", "Home"], ["/menu", "Menu"], ["/events", "Events"], ["/contact", "Contact"]] as const).map(([to, label]) => (
            <Link key={to} to={to} className="rounded-full border border-border bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur hover:border-accent hover:text-accent">{label}</Link>
          ))}
        </nav>
        <div className="mx-auto mt-10 flex w-full max-w-2xl flex-col items-center animate-slide-up">
          <img src={millsLogo.url} alt="Mill's Modern Social" className="mb-8 h-auto w-52 object-contain sm:w-60 lg:mb-16" />
          <p className="mb-3 font-mono text-xs uppercase text-accent">83 E Broadway Rd · Tempe, AZ</p>
          <h1 className="mx-auto max-w-xl font-display text-5xl uppercase leading-[0.95] text-balance sm:text-6xl lg:text-7xl">
            Good times.<br />Great connection.
          </h1>
          <p className="mx-auto mt-4 hidden max-w-lg text-sm text-foreground/80 sm:block lg:text-base">
            Join us for the game, stay for the company — and get online while you’re here.
          </p>
        </div>
      </section>

      <section className="flex min-h-[calc(100svh-230px)] items-center justify-center px-6 py-9 sm:px-10 lg:min-h-svh lg:px-12 lg:py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-7 flex size-12 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Wifi className="size-6" aria-hidden="true" />
          </div>
          <p className="mb-2 font-mono text-xs uppercase text-accent">Mills guest access</p>
          <h2 className="font-display text-4xl uppercase leading-none sm:text-5xl">Connect to Wi-Fi</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {settings.welcomeText}
          </p>

          <div className="mt-6 flex gap-3 border border-border bg-surface/70 p-4 text-sm leading-5 text-muted-foreground" role="status">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p>{ready ? "Names and email are checked for this session only, then discarded. No marketing signup or saved guest profile." : "Guest Wi-Fi setup is awaiting verification. No details are sent or saved while access is inactive."}</p>
          </div>

          {onNetwork === false && (
            <p className="mt-6 border border-destructive/50 bg-destructive/10 p-4 text-sm leading-5 text-foreground" role="alert">
              You're not connected to the Mills Wi-Fi. Join the network “{settings.networkName}” on your device, then reopen this page.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">First name</span>
                <input name="firstName" autoComplete="given-name" maxLength={60} required placeholder="First name" className="h-12 w-full rounded-md border border-input bg-background px-4 text-base text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Last name</span>
                <input name="lastName" autoComplete="family-name" maxLength={60} required placeholder="Last name" className="h-12 w-full rounded-md border border-input bg-background px-4 text-base text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={254}
                required
                placeholder="you@example.com"
                className="h-12 w-full rounded-md border border-input bg-background px-4 text-base text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                aria-describedby="wifi-email-help"
              />
              <span id="wifi-email-help" className="block text-xs leading-5 text-muted-foreground">
                Checked for this sign-in only. Not saved or used for marketing.
              </span>
            </label>

            <Button type="submit" size="lg" disabled={onNetwork !== true || !ready || !device.mac || !device.ap || busy || connected} className="h-12 w-full rounded-md bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              {connected ? "Connected" : busy ? "Connecting…" : "Connect to Wi-Fi"}
              <ArrowUpRight aria-hidden="true" />
            </Button>
            {message && (
              <p className="border border-border bg-surface p-3 text-sm leading-5 text-foreground" role="alert">
                {message}
              </p>
            )}
          </form>

          <details className="group mt-7 border-t border-border pt-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              Your privacy
              <span className="ml-auto text-xs text-muted-foreground group-open:hidden">View details</span>
              <span className="ml-auto hidden text-xs text-muted-foreground group-open:block">Hide details</span>
            </summary>
            <div className="space-y-3 pt-4 text-xs leading-5 text-muted-foreground">
              <p>
                Mill’s Modern Social, 83 E Broadway Rd, Tempe, AZ 85282, is responsible for this sign-in page. Wi-Fi equipment is operated using Ubiquiti UniFi; Spectrum supplies internet. Names and email are processed only during sign-in and are not saved or sent to the Wi-Fi equipment.
              </p>
              <p>
                Device details are used to provide and secure guest access. Marketing collection is disabled. You can ask about access, correction, deletion or other privacy rights at any time.
              </p>
              <p><strong className="text-foreground">Information processed:</strong> first name, last name and email for a transient form check; device and access-point MAC addresses and your public internet address to verify you are on the venue network. This page does not store precise location or enable analytics or advertising trackers.</p>
              <p><strong className="text-foreground">Purpose and legal basis:</strong> requested internet service and network security. Where GDPR applies, the venue must confirm the appropriate basis under Art. 6, including whether requiring names and email is necessary; no marketing consent is required for access.</p>
              <p><strong className="text-foreground">Recipients:</strong> the website hosting service processes the sign-in request; Ubiquiti receives device identifiers for authorization, not your name or email. Spectrum carries network traffic. We do not sell sign-in information.</p>
              <p><strong className="text-foreground">Retention:</strong> this website keeps no guest sign-in records. Hosting and UniFi may maintain separate security and connection logs; contact us for their actual retention periods and deletion arrangements. A day count entered in admin does not automatically delete provider logs.</p>
              <p><strong className="text-foreground">Transfers:</strong> the venue is in the United States. Provider agreements and any required international-transfer safeguards must be verified before activation; this notice does not assert that those agreements already exist.</p>
              <p><strong className="text-foreground">Your rights:</strong> where applicable, access, correction, deletion, restriction, objection and portability, and a complaint to your data protection authority. Device checks automatically allow or refuse network access; ask a team member for help if access is refused. No marketing profiling is performed.</p>
              <a
                href={`mailto:${settings.privacyEmail}?subject=Guest%20Wi-Fi%20privacy%20question`}
                className="inline-flex min-h-8 items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                Privacy questions: {settings.privacyEmail}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </details>

          <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3.5 text-accent" aria-hidden="true" />
            Free guest access · Network “{settings.networkName}”
          </p>
        </div>
      </section>
    </main>
  );
}