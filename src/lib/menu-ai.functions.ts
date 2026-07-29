import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default(""),
});

export const estimateCalories = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `Estimate the calorie count for this menu item as a single integer.\n\nName: ${data.name}\nCategory: ${data.category || "unknown"}\nDescription: ${data.description || "(none)"}\n\nReturn only JSON: {"calories": <integer>}. Use a realistic restaurant portion.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: "You are a nutrition estimator. Reply with strict JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content ?? "{}";
    let parsed: { calories?: number } = {};
    try { parsed = JSON.parse(raw); } catch { /* ignore */ }
    const cal = Number(parsed.calories);
    if (!Number.isFinite(cal) || cal <= 0) throw new Error("Could not estimate calories");
    return { calories: Math.round(cal) };
  });
