import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  formatReservationMessage,
  formatSpaceMessage,
  formatTableConfirmation,
  formatSpaceConfirmation,
  type SpaceBooking,
  type TableBooking,
} from "./whatsapp";

const digits = (v: string) => (v ?? "").replace(/[^\d]/g, "");

async function getAdminNumber(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  return digits(data?.whatsapp_number ?? "");
}

/**
 * Meta WhatsApp Cloud API - free tier covers service conversations.
 * Requires WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID secrets.
 */
async function sendViaCloudApi(to: string, body: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const num = digits(to);
  if (!token || !phoneId || !num) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: num,
        type: "text",
        text: { preview_url: false, body },
      }),
    });
    if (!res.ok) {
      console.error("WhatsApp Cloud API failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("WhatsApp Cloud API error", e);
    return false;
  }
}

/**
 * CallMeBot - free relay, but only to numbers that have opted in with the bot.
 * Used as a fallback for the ADMIN notification only.
 */
async function sendViaCallMeBot(to: string, body: string): Promise<boolean> {
  const key = process.env.CALLMEBOT_API_KEY;
  const num = digits(to);
  if (!key || !num) return false;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${num}&text=${encodeURIComponent(
      body,
    )}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("CallMeBot failed", res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("CallMeBot error", e);
    return false;
  }
}

export async function sendWhatsApp(to: string, body: string, allowRelay = false): Promise<boolean> {
  if (await sendViaCloudApi(to, body)) return true;
  if (allowRelay && (await sendViaCallMeBot(to, body))) return true;
  return false;
}

export type NotifyResult = { adminSent: boolean; customerSent: boolean };

export async function notifyTable(r: TableBooking): Promise<NotifyResult> {
  const adminNumber = await getAdminNumber();
  const [adminSent, customerSent] = await Promise.all([
    adminNumber ? sendWhatsApp(adminNumber, formatReservationMessage(r), true) : Promise.resolve(false),
    sendWhatsApp(r.phone, formatTableConfirmation(r)),
  ]);
  return { adminSent, customerSent };
}

export async function notifySpace(r: SpaceBooking): Promise<NotifyResult> {
  const adminNumber = await getAdminNumber();
  const [adminSent, customerSent] = await Promise.all([
    adminNumber ? sendWhatsApp(adminNumber, formatSpaceMessage(r), true) : Promise.resolve(false),
    sendWhatsApp(r.phone, formatSpaceConfirmation(r)),
  ]);
  return { adminSent, customerSent };
}
