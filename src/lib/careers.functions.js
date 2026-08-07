import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
const ApplicationSchema = z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    jobTitle: z.string(),
    resumeUrl: z.string().url(),
    message: z.string().optional(),
});
export const submitCareerApplication = createServerFn({ method: "POST" })
    .inputValidator((raw) => ApplicationSchema.parse(raw))
    .handler(async ({ data }) => {
    const { notifyCareerApplication } = await import("./careers.server");
    await notifyCareerApplication(data);
    return { success: true };
});
