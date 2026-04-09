import { NextResponse } from "next/server";

interface ContactPayload {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "info@dishframe.nl";
  const toEmail = process.env.CONTACT_TO_EMAIL || "info@dishframe.nl";

  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Resend is nog niet ingesteld. Voeg eerst je RESEND_API_KEY toe." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as ContactPayload;
  const name = payload.name?.trim() || "";
  const email = payload.email?.trim() || "";
  const topic = payload.topic?.trim() || "";
  const message = payload.message?.trim() || "";

  if (!name || !email || !topic || !message) {
    return NextResponse.json({ error: "Vul alle velden in." }, { status: 400 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `DishFrame <${fromEmail}>`,
      to: [toEmail],
      reply_to: email,
      subject: `Contactformulier: ${topic}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#2f261f;line-height:1.7;">
          <h2 style="margin:0 0 16px;">Nieuw bericht via DishFrame</h2>
          <p style="margin:0 0 8px;"><strong>Naam:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 8px;"><strong>E-mailadres:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 8px;"><strong>Onderwerp:</strong> ${escapeHtml(topic)}</p>
          <p style="margin:16px 0 8px;"><strong>Bericht:</strong></p>
          <div style="padding:16px;border:1px solid #eadbc4;border-radius:16px;background:#fffaf2;">
            ${escapeHtml(message).replace(/\n/g, "<br />")}
          </div>
        </div>
      `
    })
  });

  if (!response.ok) {
    const result = await response.text();
    return NextResponse.json(
      { error: `Het bericht kon niet worden verstuurd. ${result}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
