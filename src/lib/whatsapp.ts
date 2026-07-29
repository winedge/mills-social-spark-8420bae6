import { supabase } from "@/integrations/supabase/client";

export async function getWhatsAppNumber(): Promise<string> {
  const { data } = await supabase
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  return (data?.whatsapp_number ?? "").replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function formatReservationMessage(r: {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  party_size: number;
  special_requests?: string | null;
}): string {
  return [
    "🍽️ *New Table Reservation — Mill's Modern Social*",
    "",
    `👤 *Name:* ${r.name}`,
    `📞 *Phone:* ${r.phone}`,
    `📧 *Email:* ${r.email}`,
    `📅 *Date:* ${r.date}`,
    `🕒 *Time:* ${r.time}`,
    `👥 *Party:* ${r.party_size} guests`,
    r.special_requests ? `📝 *Notes:* ${r.special_requests}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatSpaceMessage(r: {
  name: string;
  phone: string;
  email: string;
  event_date: string;
  party_size: number;
  space: string;
  message?: string | null;
}): string {
  return [
    "🎉 *New Space Reservation — Mill's Modern Social*",
    "",
    `👤 *Name:* ${r.name}`,
    `📞 *Phone:* ${r.phone}`,
    `📧 *Email:* ${r.email}`,
    `📅 *Event Date:* ${r.event_date}`,
    `👥 *Party:* ${r.party_size} guests`,
    `📍 *Space:* ${r.space}`,
    r.message ? `📝 *Notes:* ${r.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function openWhatsAppNotification(message: string): Promise<boolean> {
  const num = await getWhatsAppNumber();
  if (!num) return false;
  const url = buildWhatsAppUrl(num, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
