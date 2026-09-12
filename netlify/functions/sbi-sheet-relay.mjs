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
 *
 * ---------------------------------------------------------------
 * CONFIGURATION — Netlify: Site configuration > Environment variables
 *
 *   SBI_APPS_SCRIPT_URL    the Apps Script Web App /exec URL
 *   SBI_APPS_SCRIPT_KEY    the key that URL expects as ?key=
 *   SBI_RELAY_INBOUND_KEY  optional but recommended. When set, a request
 *                          must carry a matching x-navren-relay-key
 *                          header or it is refused. Without it this
 *                          function's public URL is an open write path
 *                          into the Sheet for anyone who finds it. Set
 *                          the same value as a custom header on the
 *                          Netlify outgoing form webhook.
 *
 * These used to be literals in this file, which put them in a public
 * repository. They are read from the environment now; the old values
 * are in git history and must be treated as compromised and rotated.
 * ---------------------------------------------------------------
 */

/* Apps Script is not fast under load. If it hangs, this function would
   hang with it and eventually be killed by the platform, which is the
   one thing that makes Netlify retry and duplicate rows again. */
const UPSTREAM_TIMEOUT_MS = 8000;
/* A form submission is a few KB. Anything far past that is not one. */
const MAX_BODY_BYTES = 64 * 1024;

function env(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env) {
      const v = Netlify.env.get(name);
      if (v) return v;
    }
  } catch (err) { /* not on the v2 runtime, fall through */ }
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name];
  }
  return "";
}

/* Length-independent comparison, so a wrong key can't be narrowed down
   by timing the response. */
function sameSecret(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* A cell starting with = + - @ (or a control character) is read as a
   formula when the Sheet is opened, not as text. A leading apostrophe
   forces text and is not shown in the cell. */
function deFormula(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}
function sanitize(node, depth) {
  if (depth > 6) return node;
  if (typeof node === "string") return deFormula(node);
  if (Array.isArray(node)) return node.map((v) => sanitize(v, depth + 1));
  if (node && typeof node === "object") {
    const out = {};
    for (const key of Object.keys(node)) out[key] = sanitize(node[key], depth + 1);
    return out;
  }
  return node;
}

/* Netlify is told everything is fine no matter what, on purpose: a
   non-200 here is what makes it retry and duplicate the row. Failures
   are recorded in the function log instead. */
function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const inboundKey = env("SBI_RELAY_INBOUND_KEY");
  if (inboundKey) {
    if (!sameSecret(req.headers.get("x-navren-relay-key") || "", inboundKey)) {
      console.warn("sbi-sheet-relay: refused a request with no or wrong inbound key");
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    console.warn(
      "sbi-sheet-relay: SBI_RELAY_INBOUND_KEY is not set, so this endpoint " +
      "accepts unauthenticated POSTs from anyone who knows its URL"
    );
  }

  const scriptUrl = env("SBI_APPS_SCRIPT_URL");
  const scriptKey = env("SBI_APPS_SCRIPT_KEY");
  if (!scriptUrl || !scriptKey) {
    /* Never log the values themselves, only which one is missing. */
    console.error(
      "sbi-sheet-relay: not forwarding, missing " +
      (!scriptUrl ? "SBI_APPS_SCRIPT_URL " : "") +
      (!scriptKey ? "SBI_APPS_SCRIPT_KEY" : "")
    );
    return ok();
  }

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      console.error("sbi-sheet-relay: refused an oversized body,", raw.length, "bytes");
      return ok();
    }

    /* Forward the same shape that arrived. If it parses as JSON the
       values are made inert for a spreadsheet first; if it does not,
       it goes on untouched rather than being dropped. */
    let body = raw;
    try {
      body = JSON.stringify(sanitize(JSON.parse(raw), 0));
    } catch (err) { /* not JSON, forward verbatim */ }

    const abort = new AbortController();
    const cutoff = setTimeout(() => abort.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const resp = await fetch(
        `${scriptUrl}?key=${encodeURIComponent(scriptKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: abort.signal,
        }
      );
      /* Status only. The response body can echo back what was submitted,
         and function logs are not the place for someone's name, email
         and phone number to sit indefinitely. */
      if (resp.ok) {
        console.log("sbi-sheet-relay: forwarded ok,", resp.status);
      } else {
        console.error("sbi-sheet-relay: upstream refused it,", resp.status);
      }
    } finally {
      clearTimeout(cutoff);
    }
  } catch (err) {
    /* err only: the request body is the submission itself. */
    console.error(
      "sbi-sheet-relay: forward failed:",
      err && err.name === "AbortError" ? "upstream timed out" : err
    );
  }

  return ok();
};
