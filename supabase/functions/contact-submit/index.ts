import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const notifyEmail = Deno.env.get("CONTACT_NOTIFY_EMAIL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL") ?? "onboarding@resend.dev";

  if (!resendKey || !notifyEmail || !supabaseUrl || !serviceRoleKey) {
    console.error("Missing RESEND_API_KEY, CONTACT_NOTIFY_EMAIL, or Supabase env");
    return json({ error: "Contact form is not configured on the server." }, 503);
  }

  let payload: { email?: string; name?: string; message?: string; company?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (payload.company) {
    return json({ ok: true });
  }

  const email = sanitizeText(payload.email, 254).toLowerCase();
  const name = sanitizeText(payload.name, 80);
  const message = sanitizeText(payload.message, 2000);

  if (!email || !message) {
    return json({ error: "Email and message are required." }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error: insertError } = await supabase.from("contact_inquiries").insert({
    email,
    name: name || null,
    message,
  });

  if (insertError) {
    console.error("Insert failed:", insertError.message);
    return json({ error: "Could not save your message. Please try again." }, 500);
  }

  const subject = name
    ? `Vervio contact — ${name}`
    : "New message from Vervio contact form";

  const text = [
    name ? `Name: ${name}` : null,
    `Email: ${email}`,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notifyEmail],
      reply_to: email,
      subject,
      text,
    }),
  });

  if (!emailRes.ok) {
    const detail = await emailRes.text();
    console.error("Resend failed:", detail);
    return json(
      {
        error:
          "Your message was saved, but the email notification failed. Check Supabase → contact_inquiries.",
      },
      502,
    );
  }

  return json({ ok: true });
});
