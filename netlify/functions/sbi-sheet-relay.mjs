/**
 * Relays Small Business Initiative form submissions from Netlify's
 * outgoing webhook to the Google Apps Script endpoint that writes them
 * into the Sheet.
 *
 * This exists because Apps Script Web Apps always answer through a
 * redirect (google.com -> googleusercontent.com), and Netlify's webhook
 * sender treats that as a failed delivery and retries — which was
 * writing the same submission into the Sheet multiple times, and
 * eventually got the webhook auto-disabled by Netlify entirely. This
 * function sits in between: it makes the (redirect-following) call to
 * Apps Script itself and always answers Netlify with a plain 200, so
 * Netlify sees a normal, fast, successful delivery every time.
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqldRNS3NjW9h7g4U-l8_QbhsaTxPfohIB0eeIH2iwAF5yxEFr-p2i4svrUkk5SkRI/exec";
const SECRET = "navren-sbi-9f2k";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let bodyText = "";
  try {
    bodyText = await req.text();
    const resp = await fetch(`${APPS_SCRIPT_URL}?key=${SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    });
    const text = await resp.text();
    console.log("sbi-sheet-relay: forwarded ok,", resp.status, text.slice(0, 200));
  } catch (err) {
    console.error("sbi-sheet-relay: forward failed:", err, bodyText.slice(0, 500));
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
