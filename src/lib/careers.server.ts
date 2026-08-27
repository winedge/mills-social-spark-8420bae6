import { supabaseAdmin } from "../integrations/supabase/client.server";

export type CareerApplication = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  resumeUrl: string;
  message?: string;
};

async function getAdminEmails(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("notification_email")
    .eq("id", 1)
    .maybeSingle();
  const configured = (data as any)?.notification_email;
  const recipients = ["info@millsmodernsocial.com", "work-mms@millsmodernsocial.com"];
  if (configured && !recipients.includes(configured)) {
    recipients.push(configured);
  }
  return recipients;
}

async function getAdminWhatsApp(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  return (data as any)?.whatsapp_number?.replace(/[^\d]/g, "") ?? "";
}

export async function notifyCareerApplication(app: CareerApplication) {
  const adminEmails = await getAdminEmails();
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
  for (const to_email of adminEmails) {
    try {
      await (supabaseAdmin as any).rpc("send_transactional_email", {
        to_email,
        subject,
        body_text: body
      });
    } catch (e) {
      // Log failure but don't crash
    }
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
