import { test } from "node:test";
import assert from "node:assert/strict";
import { isOnVenueNetwork, parseAllowedIps } from "./wifi-network";

test("guest on the venue's internet address is allowed", () => {
  assert.equal(isOnVenueNetwork("203.0.113.7", ["203.0.113.7"]), true);
});
test("guest on another network is blocked", () => {
  assert.equal(isOnVenueNetwork("198.51.100.4", ["203.0.113.7"]), false);
});
test("unknown guest address is blocked once the check is active", () => {
  assert.equal(isOnVenueNetwork(null, ["203.0.113.7"]), false);
});
test("check is inactive until an address is saved", () => {
  assert.equal(isOnVenueNetwork("198.51.100.4", []), true);
});
test("address ranges with * match", () => {
  assert.equal(isOnVenueNetwork("203.0.113.99", parseAllowedIps("203.0.113.*")), true);
});
