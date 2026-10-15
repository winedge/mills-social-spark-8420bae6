import { describe, expect, test } from "bun:test";
import { selectHeroVideo } from "./hero-video";

describe("homepage device videos", () => {
  const videos = { hero_video_url: "horizontal.mp4", mobile_hero_video_url: "vertical.mp4" };
  test("desktop viewers get the horizontal video", () => {
    expect(selectHeroVideo(videos, false, "default.mp4")).toBe("horizontal.mp4");
  });
  test("mobile viewers get the vertical video", () => {
    expect(selectHeroVideo(videos, true, "default.mp4")).toBe("vertical.mp4");
  });
  test("mobile uses desktop until a vertical video is uploaded", () => {
    expect(selectHeroVideo({ hero_video_url: "horizontal.mp4" }, true, "default.mp4")).toBe("horizontal.mp4");
  });
});