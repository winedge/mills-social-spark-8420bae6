import { test } from "node:test";
import assert from "node:assert/strict";
import { unifiConfigSchema, unifiPublicView, unifiSitesUrl } from "./unifi-config";
import { encryptUnifiKey, decryptUnifiKey } from "./unifi-crypto.server";

test("UniFi settings keep credentials out of the admin read response", () => {
  const view = unifiPublicView({ console_id: "console", site_id: "", session_minutes: 240,
    api_key_encrypted: "synthetic-ciphertext", last_test_at: null, last_test_ok: false });
  assert.equal(view.hasApiKey, true);
  assert.equal("api_key_encrypted" in view, false);
  assert.equal("apiKey" in view, false);
});
test("UniFi credentials are only sent to Ubiquiti's fixed API origin", () => {
  assert.equal(new URL(unifiSitesUrl("abc_DEF-123")).origin, "https://api.ui.com");
  assert.throws(() => unifiSitesUrl("../../evil.example"));
  assert.throws(() => unifiSitesUrl("https://evil.example"));
});
test("UniFi settings reject invalid session lengths", () => {
  const base = { consoleId: "console", siteId: "" };
  assert.equal(unifiConfigSchema.safeParse({ ...base, sessionMinutes: 15 }).success, true);
  assert.equal(unifiConfigSchema.safeParse({ ...base, sessionMinutes: 1440 }).success, true);
  assert.equal(unifiConfigSchema.safeParse({ ...base, sessionMinutes: 14 }).success, false);
  assert.equal(unifiConfigSchema.safeParse({ ...base, sessionMinutes: 1441 }).success, false);
});
test("UniFi API key is encrypted and rejects tampering", async () => {
  // Synthetic test fixtures only, never production secrets.
  const fixture = "test-fixture-not-a-provider-key";
  const encrypted = await encryptUnifiKey(fixture, "test-fixture-encryption-secret");
  assert.notEqual(encrypted, fixture);
  assert.equal(await decryptUnifiKey(encrypted, "test-fixture-encryption-secret"), fixture);
  await assert.rejects(decryptUnifiKey(encrypted, "wrong-test-fixture"));
});