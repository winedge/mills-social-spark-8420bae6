import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CareerApplication = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  resumeUrl: string;
  message?: string;
};

async function getAdminEmail(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("notification_email")
    .eq("id", 1)
    .maybeSingle();
  return data?.notification_email ?? "admin@millsmodernsocial.com";
}

async function getAdminWhatsApp(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  return data?.whatsapp_number?.replace(/[^\d]/g, "") ?? "";
}

export async function notifyCareerApplication(app: CareerApplication) {
  const adminEmail = await getAdminEmail();
  const adminWhatsApp = await getAdminWhatsApp();
  
  const subject = `📄 New Career Application: ${app.fullName}`;
  const body = [
    `New application received for: ${app.jobTitle}`,
    ``,
    `Name: ${app.fullName}`,
    `Email: ${app.email}`,
    `Phone: ${app.phone}`,
    app.message ? `Message: ${app.message}` : "",
    `Resume: ${app.resumeUrl}`,
  ].filter(Boolean).join("\n");

  // Email Notification via generic RPC if available
  try {
     await (supabaseAdmin as any).rpc("send_transactional_email", {
      to_email: adminEmail,
      subject,
      body_text: body
    });
  } catch (e) {
    console.warn("Email RPC failed (likely not created yet):", e);
  }

  // WhatsApp Notification (using existing logic)
  if (adminWhatsApp) {
    const { sendWhatsApp } = await import("./notify.server");
    const waBody = [
      `📄 *New Career Application* - Mill's`,
      ``,
      `👤 *Name:* ${app.fullName}`,
      `💼 *Role:* ${app.jobTitle}`,
      `📧 *Email:* ${app.email}`,
      `📎 *Resume:* ${app.resumeUrl}`
    ].join("\n");
    await sendWhatsApp(adminWhatsApp, waBody, true);
  }
}
