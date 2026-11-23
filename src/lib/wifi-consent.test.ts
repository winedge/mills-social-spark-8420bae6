import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { wifiMarketingOptInDefault } from "./wifi-consent";

describe("guest Wi-Fi privacy", () => {
  test("marketing email is not enabled by default", () => {
    assert.equal(wifiMarketingOptInDefault, false);
  });
});