export function buildWhatsAppUrl(number, message) {
    const digits = number.replace(/[^\d]/g, "");
    if (!digits)
        return "";
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
export function formatReservationMessage(r) {
    return [
        "🍽️ *New Table Reservation - Mill's Modern Social*",
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
export function formatSpaceMessage(r) {
    return [
        "🎉 *New Space Reservation - Mill's Modern Social*",
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
/** Confirmation sent to the CUSTOMER's WhatsApp. */
export function formatTableConfirmation(r) {
    return [
        `Hi ${r.name}! 🍻`,
        "",
        "Your table at *Mill's Modern Social* is confirmed:",
        `📅 ${r.date}  •  🕒 ${r.time}`,
        `👥 ${r.party_size} guests`,
        "",
        "📍 Mill Ave & Broadway, Tempe, AZ",
        "Reply to this message if anything changes. See you soon!",
    ].join("\n");
}
export function formatSpaceConfirmation(r) {
    return [
        `Hi ${r.name}! 🎉`,
        "",
        "We've received your space request at *Mill's Modern Social*:",
        `📍 ${r.space}`,
        `📅 ${r.event_date}  •  👥 ${r.party_size} guests`,
        "",
        "Our events team will confirm the details shortly. Thanks for choosing us!",
    ].join("\n");
}
