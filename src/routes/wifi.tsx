import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, Info, Mail, ShieldCheck, Wifi } from "lucide-react";
import millsLogo from "@/assets/mills-logo.png.asset.json";
import venuePhoto from "@/assets/hero-bar.jpg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { wifiMarketingOptInDefault } from "@/lib/wifi-consent";

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
    ],
  }),
  component: GuestWifiPage,
});

function GuestWifiPage() {
  const [marketingOptIn, setMarketingOptIn] = useState(wifiMarketingOptInDefault);
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(
      "Guest Wi-Fi is not connected to this sign-in page yet. Your information was not sent or saved. Please ask a Mills team member for access.",
    );
  };

  return (
    <main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_35rem]">
      <section className="relative isolate flex min-h-[230px] items-end overflow-hidden px-6 pb-7 pt-8 sm:px-10 lg:min-h-svh lg:px-14 lg:pb-14 lg:pt-12">
        <img
          src={venuePhoto}
          alt="Inside Mill's Modern Social"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/65 to-background/25 lg:bg-gradient-to-r lg:from-background/80 lg:via-background/30 lg:to-background/20" />
        <div className="w-full max-w-2xl animate-slide-up">
          <img src={millsLogo.url} alt="Mill's Modern Social" className="mb-8 h-auto w-52 object-contain sm:w-60 lg:mb-16" />
          <p className="mb-3 font-mono text-xs uppercase text-accent">83 E Broadway Rd · Tempe, AZ</p>
          <h1 className="max-w-xl font-display text-5xl uppercase leading-[0.95] text-balance sm:text-6xl lg:text-7xl">
            Good times.<br />Great connection.
          </h1>
          <p className="mt-4 hidden max-w-lg text-sm text-foreground/80 sm:block lg:text-base">
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
            Enter your email to get online. Marketing emails are optional and never required for Wi-Fi access.
          </p>

          <div className="mt-6 flex gap-3 border border-border bg-surface/70 p-4 text-sm leading-5 text-muted-foreground" role="status">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p>This sign-in page is awaiting connection to the venue’s Wi-Fi service. Your details are not collected here.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                Used only for Wi-Fi access unless you separately opt in below.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-muted-foreground">
              <Checkbox
                checked={marketingOptIn}
                onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                aria-label="Receive occasional Mills news and offers by email"
                className="mt-0.5"
              />
              <span>Send me occasional Mills news, offers, and event updates by email. I can unsubscribe anytime.</span>
            </label>

            <Button type="submit" size="lg" className="h-12 w-full rounded-md bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              Connect to Wi-Fi
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
                Mill’s Modern Social, 83 E Broadway Rd, Tempe, AZ 85282, is responsible for this sign-in page. This page currently does not send or store information. When a Wi-Fi provider is connected, its name, the exact information it receives, and how long it keeps it must be shown here before sign-in is activated.
              </p>
              <p>
                Wi-Fi details will be used to provide and secure guest access. Promotional email is separate and only sent if you choose the optional box. You can withdraw marketing permission or ask about access, correction, deletion, or other privacy rights at any time.
              </p>
              <a
                href="mailto:info@millsmodernsocial.com?subject=Guest%20Wi-Fi%20privacy%20question"
                className="inline-flex min-h-8 items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                Privacy questions: info@millsmodernsocial.com
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </details>

          <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3.5 text-accent" aria-hidden="true" />
            Free guest access at Mill’s Modern Social
          </p>
        </div>
      </section>
    </main>
  );
}