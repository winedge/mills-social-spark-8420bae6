import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { selectHeroVideo } from "./hero-video";

describe("homepage device videos", () => {
  const videos = { hero_video_url: "horizontal.mp4", mobile_hero_video_url: "vertical.mp4" };
  test("desktop viewers get the horizontal video", () => {
    assert.equal(selectHeroVideo(videos, false, "default.mp4"), "horizontal.mp4");
  });
  test("mobile viewers get the vertical video", () => {
    assert.equal(selectHeroVideo(videos, true, "default.mp4"), "vertical.mp4");
  });
  test("mobile uses desktop until a vertical video is uploaded", () => {
    assert.equal(selectHeroVideo({ hero_video_url: "horizontal.mp4" }, true, "default.mp4"), "horizontal.mp4");
  });
});