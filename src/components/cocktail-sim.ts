/* Shared simulation state for the 3D Mix-the-Cocktail experience. */

export type Phase = "intro" | "recipe" | "ingredients" | "shake" | "pour" | "result";

export const POUR_TARGET = 0.82; // glass fill line (0..1 of bowl depth)

export type Sim = {
  shakerFill: number;
  glassFill: number;
  froth: number;
  shakeLevel: number;
  tilt: number;
  hue: number;
  ice: { x: number; y: number; vx: number; vy: number; r: number; rot: number }[];
  mint: { x: number; y: number; p: number }[];
  garnish: { lime: boolean; cherry: boolean; orange: boolean };
  spill: number;
  pourFlow: number;
};

export function makeSim(): Sim {
  return {
    shakerFill: 0,
    glassFill: 0,
    froth: 0,
    shakeLevel: 0,
    tilt: 0,
    hue: 150,
    ice: [],
    mint: [],
    garnish: { lime: false, cherry: false, orange: false },
    spill: 0,
    pourFlow: 0,
  };
}
