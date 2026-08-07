import { supabaseAdmin } from "../integrations/supabase/client.server";

export async function logPageView(path: string, referrer?: string, userAgent?: string, sessionId?: string) {
  if (!sessionId) return;
  
  try {
    await supabaseAdmin.from("page_views").insert({
      path,
      referrer: referrer || null,
      user_agent: userAgent || null,
      session_id: sessionId,
    });
  } catch (e) {
    console.error("Failed to log page view:", e);
  }
}

export async function notifyAdminAction(title: string, details: string) {
  const { data: settings } = await supabaseAdmin
    .from("site_settings")
    .select("notification_email, whatsapp_number")
    .eq("id", 1)
    .maybeSingle();

  const email = (settings as any)?.notification_email;
  const whatsapp = (settings as any)?.whatsapp_number?.replace(/[^\d]/g, "");

  if (email) {
    try {
      await (supabaseAdmin as any).rpc("send_transactional_email", {
        to_email: email,
        subject: `🔔 Mill's Admin: ${title}`,
        body_text: details
      });
    } catch (e) {
      // Log failure but don't crash
    }
  }

  if (whatsapp) {
    const { sendWhatsApp } = await import("./notify.server");
    await sendWhatsApp(whatsapp, `*Mill's Admin Notification*\n\n*Title:* ${title}\n*Details:* ${details}`, true);
  }
}
