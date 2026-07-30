import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TableInput = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email(),
  date: z.string().min(1),
  time: z.string().min(1),
  party_size: z.number().int().positive(),
  special_requests: z.string().nullable().optional(),
});

const SpaceInput = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email(),
  event_date: z.string().min(1),
  party_size: z.number().int().positive(),
  space: z.string().min(1),
  message: z.string().nullable().optional(),
});

/** Fired right after a public table booking is stored. */
export const notifyTableBooking = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => TableInput.parse(raw))
  .handler(async ({ data }) => {
    const { notifyTable } = await import("./notify.server");
    return notifyTable(data);
  });

/** Fired right after a public space request is stored. */
export const notifySpaceBooking = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => SpaceInput.parse(raw))
  .handler(async ({ data }) => {
    const { notifySpace } = await import("./notify.server");
    return notifySpace(data);
  });

const ConfirmInput = z.object({
  kind: z.enum(["table", "space"]),
  id: z.string().uuid(),
});

/** Admin action: send a WhatsApp confirmation to the customer. */
export const sendCustomerConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ConfirmInput.parse(raw))
  .handler(async ({ data, context }): Promise<{ sent: boolean; fallbackUrl: string }> => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { sendWhatsApp } = await import("./notify.server");
    const {
      formatTableConfirmation,
      formatSpaceConfirmation,
      buildWhatsAppUrl,
    } = await import("./whatsapp");

    if (data.kind === "table") {
      const { data: row } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (!row) throw new Error("Not found");
      const body = formatTableConfirmation(row as any);
      const sent = await sendWhatsApp(row.phone, body);
      return { sent, fallbackUrl: sent ? "" : buildWhatsAppUrl(row.phone, body) };
    }

    const { data: row } = await supabase
      .from("space_reservations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Not found");
    const body = formatSpaceConfirmation(row as any);
    const sent = await sendWhatsApp(row.phone, body);
    return { sent, fallbackUrl: sent ? "" : buildWhatsAppUrl(row.phone, body) };
  });
