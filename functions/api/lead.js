// Cloudflare Pages Function: receives the demo request from demo.html and
// forwards it to the CRM / automation webhook set in LEAD_WEBHOOK_URL
// (HubSpot, Make, Zapier, n8n...). Without it, requests are refused so no lead is lost silently.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Honeypot filled in: answer like a success, store nothing.
  if (clip(data.company_website)) return json({ ok: true });

  const lead = {
    email: clip(data.email, 254).toLowerCase(),
    name: clip(data.name),
    company: clip(data.company),
    role: clip(data.role),
    phone: clip(data.phone, 40),
    team_size: clip(data.team_size, 10),
    privacy_consent: data.privacy_consent === true,
    page: clip(data.page),
    referrer: clip(data.referrer, 500),
    submitted_at: clip(data.submitted_at, 40),
  };
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "li_fat_id", "msclkid"]) {
    if (data[k]) lead[k] = clip(data[k], 300);
  }

  if (!emailRe.test(lead.email) || lead.name.length < 2 || !lead.company || !lead.role || !lead.privacy_consent) {
    return json({ ok: false, error: "missing_fields" }, 422);
  }

  if (!env.LEAD_WEBHOOK_URL) return json({ ok: false, error: "not_configured" }, 503);

  lead.ip_country = request.headers.get("cf-ipcountry") || "";
  const res = await fetch(env.LEAD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) return json({ ok: false, error: "upstream_" + res.status }, 502);
  return json({ ok: true });
}
