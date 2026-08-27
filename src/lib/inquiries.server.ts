import { supabaseAdmin } from "../integrations/supabase/client.server";

export type InquiryKind = "contact" | "events" | "play";

export type InquiryPayload = {
  kind: InquiryKind;
  name: string;
  email: string;
  phone?: string;
  eventDate?: string;
  guests?: number;
  subject?: string;
  message?: string;
};

const RECIPIENTS: Record<InquiryKind, string[]> = {
  contact: ["info@millsmodernsocial.com", "contactus@millsmodernsocial.com"],
  events: ["info@millsmodernsocial.com", "events@millsmodernsocial.com"],
  play: ["info@millsmodernsocial.com", "play@millsmodernsocial.com"],
};

const LABEL: Record<InquiryKind, string> = {
  contact: "Contact Message",
  events: "Event Inquiry",
  play: "Game Floor Booking",
};

async function getAdminWhatsApp(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  return (data as any)?.whatsapp_number?.replace(/[^\d]/g, "") ?? "";
}

export async function notifyInquiry(p: InquiryPayload) {
  const subject = `📥 New ${LABEL[p.kind]}: ${p.name}`;
  const body = [
    `New ${LABEL[p.kind].toLowerCase()} received.`,
    ``,
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    p.phone ? `Phone: ${p.phone}` : "",
    p.eventDate ? `Preferred date: ${p.eventDate}` : "",
    p.guests ? `Guests: ${p.guests}` : "",
    p.subject ? `Subject: ${p.subject}` : "",
    p.message ? `Message: ${p.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  for (const to_email of RECIPIENTS[p.kind]) {
    try {
      await (supabaseAdmin as any).rpc("send_transactional_email", {
        to_email,
        subject,
        body_text: body,
      });
    } catch {
      // non-fatal
    }
  }

  try {
    const wa = await getAdminWhatsApp();
    if (wa) {
      const { sendWhatsApp } = await import("./notify.server");
      await sendWhatsApp(wa, `*${LABEL[p.kind]}* - Mill's\n\n${body}`, true);
    }
  } catch {
    // non-fatal
  }
}

export async function saveInquiry(p: InquiryPayload) {
  if (p.kind !== "contact") {
    await (supabaseAdmin as any).from("inquiries").insert({
      kind: p.kind,
      name: p.name,
      email: p.email,
      phone: p.phone ?? "",
      event_date: p.eventDate || null,
      guests: p.guests ?? null,
      subject: p.subject ?? "",
      message: p.message ?? "",
    });
  }
  await notifyInquiry(p);
}
