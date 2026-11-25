import { test } from "node:test";
import assert from "node:assert/strict";
import { canAuthorizeVenueIp, guestSignInSchema } from "./unifi-guest";
import { authorizeConnectedGuest } from "./unifi-guest.server";

const guestId = "11111111-1111-4111-8111-111111111111";
const apId = "22222222-2222-4222-8222-222222222222";
const options = { consoleId: "console:123", siteId: "33333333-3333-4333-8333-333333333333", apiKey: "synthetic-test-fixture", mac: "02:11:22:33:44:55", ap: "02:aa:bb:cc:dd:ee", sessionMinutes: 240 };
const guest = { id: guestId, type: "WIRELESS", macAddress: options.mac, uplinkDeviceId: apId, access: { type: "GUEST", authorized: false } };

test("guest authorization is blocked without configured venue addresses", () => {
  assert.equal(canAuthorizeVenueIp("203.0.113.7", []), false);
});
test("guest authorization requires the restaurant's exact network address", () => {
  assert.equal(canAuthorizeVenueIp("203.0.113.7", ["203.0.113.7"]), true);
  assert.equal(canAuthorizeVenueIp("198.51.100.4", ["203.0.113.7"]), false);
  assert.equal(canAuthorizeVenueIp(null, ["203.0.113.7"]), false);
  assert.equal(canAuthorizeVenueIp("203.0.113.7", ["203.0.113.*"]), false);
});
test("sign-in requires first name, last name, email and real MAC syntax", () => {
  const input = { firstName: "Test", lastName: "Guest", email: "guest@example.com", mac: options.mac, ap: options.ap };
  assert.equal(guestSignInSchema.safeParse(input).success, true);
  assert.equal(guestSignInSchema.safeParse({ ...input, firstName: " " }).success, false);
  assert.equal(guestSignInSchema.safeParse({ ...input, lastName: "" }).success, false);
  assert.equal(guestSignInSchema.safeParse({ ...input, mac: "../actions" }).success, false);
});
test("verified wireless guest is authorized for 240 minutes and read back", async () => {
  const calls: { url: string; body?: string }[] = [];
  const request: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), ...(typeof init?.body === "string" ? { body: init.body } : {}) });
    assert.equal(new URL(String(url)).origin, "https://api.ui.com");
    assert.equal(init?.redirect, "manual");
    if (String(url).includes("/clients?")) return Response.json({ data: [guest] });
    if (String(url).includes("/devices/")) return Response.json({ macAddress: options.ap });
    if (String(url).endsWith("/actions")) return Response.json({ action: "AUTHORIZE_GUEST_ACCESS" });
    return Response.json({ ...guest, access: { type: "GUEST", authorized: true } });
  };
  assert.deepEqual(await authorizeConnectedGuest(options, request), { connected: true });
  assert.equal(calls.length, 4);
  const action = calls.find((c) => c.body);
  assert.deepEqual(JSON.parse(action?.body ?? "null"), { action: "AUTHORIZE_GUEST_ACCESS", timeLimitMinutes: 240 });
});
test("a non-guest device never triggers authorization", async () => {
  let calls = 0;
  const request: typeof fetch = async () => { calls++; return Response.json({ data: [{ ...guest, access: { type: "DEFAULT", authorized: false } }] }); };
  await assert.rejects(authorizeConnectedGuest(options, request));
  assert.equal(calls, 1);
});
test("forged access-point parameters never authorize a guest", async () => {
  let actions = 0;
  const request: typeof fetch = async (url) => {
    if (String(url).includes("/actions")) actions++;
    return Response.json(String(url).includes("/clients?") ? { data: [guest] } : { macAddress: "02:00:00:00:00:00" });
  };
  await assert.rejects(authorizeConnectedGuest(options, request));
  assert.equal(actions, 0);
});
test("a successful action alone cannot report connected", async () => {
  const request: typeof fetch = async (url) => Response.json(String(url).includes("/clients?") ? { data: [guest] } : String(url).includes("/devices/") ? { macAddress: options.ap } : guest);
  await assert.rejects(authorizeConnectedGuest(options, request));
});
test("already authorized guests do not extend their session by resubmitting", async () => {
  let actions = 0;
  const authorized = { ...guest, access: { type: "GUEST", authorized: true } };
  const request: typeof fetch = async (url) => {
    if (String(url).includes("/actions")) actions++;
    return Response.json(String(url).includes("/clients?") ? { data: [authorized] } : String(url).includes("/devices/") ? { macAddress: options.ap } : authorized);
  };
  assert.deepEqual(await authorizeConnectedGuest(options, request), { connected: true });
  assert.equal(actions, 0);
});