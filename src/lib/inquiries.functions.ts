import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InquirySchema = z.object({
  kind: z.enum(["contact", "events", "play"]),
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional(),
  eventDate: z.string().max(40).optional(),
  guests: z.number().int().positive().max(2000).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().max(4000).optional(),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((raw) => InquirySchema.parse(raw))
  .handler(async ({ data }) => {
    const { saveInquiry } = await import("./inquiries.server");
    await saveInquiry(data);
    return { success: true };
  });
