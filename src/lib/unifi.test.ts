import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeMac } from "./unifi";
test("accepts colon and dash MACs", () => {
  assert.equal(normalizeMac("AA-BB-CC-DD-EE-FF"), "aa:bb:cc:dd:ee:ff");
  assert.equal(normalizeMac("aa:bb:cc:dd:ee:0f"), "aa:bb:cc:dd:ee:0f");
});
test("rejects junk", () => {
  assert.equal(normalizeMac("aa:bb:cc"), null);
  assert.equal(normalizeMac("zz:bb:cc:dd:ee:ff"), null);
  assert.equal(normalizeMac(42), null);
});
