/**
 * Adds newsletter signups to a Mailchimp audience.
 *
 * Netlify's outgoing form webhook posts each verified submission here and
 * this function upserts the address into Mailchimp. Netlify Forms stays the
 * system of record — Mailchimp is a copy — so a Mailchimp failure loses
 * nothing, and the submission is still in the Netlify UI either way.
 *
 * Same shape as sbi-sheet-relay.mjs, and for the same reason: Netlify retries
 * a webhook it considers failed, so this always answers 200 and records
 * problems in the function log instead. A retry here is harmless on
 * Mailchimp's side (the upsert is idempotent), but repeated failures get the
 * webhook auto-disabled by Netlify, which is how the Sheet relay broke.
 *
 * ---------------------------------------------------------------
 * CONFIGURATION — Netlify: Site configuration > Environment variables
 *
 *   MAILCHIMP_API_KEY       Account & billing > Extras > API keys. The
 *                           trailing -us21 style suffix is the datacenter and
 *                           is parsed out of the key, so paste it whole.
 *   MAILCHIMP_AUDIENCE_ID   Audience > Settings > Audience name and defaults.
 *   MAILCHIMP_INBOUND_KEY   recommended. When set, a request must carry a
 *                           matching x-navren-relay-key header or it is
 *                           refused. Without it this function's public URL is
 *                           an open write path into the audience for anyone
 *                           who finds it. Set the same value as a custom
 *                           header on the Netlify outgoing form webhook.
 *
 * Optional:
 *   MAILCHIMP_STATUS        "pending" (default, double opt-in) or "subscribed".
 *   MAILCHIMP_FORMS         comma-separated form names allowed to sync.
 *                           Defaults to "newsletter" alone — see the note at
 *                           the bottom of this comment.
 *
 * Only the newsletter form is synced by default, and that is deliberate. It is
 * the only form on the site where submitting *is* a request for marketing
 * email. contact, questionnaire and small-business-initiative are people
 * asking a question or applying to something; adding them to a marketing
 * audience without a separate opt-in checkbox is the thing CAN-SPAM and GDPR
 * are about. Add them to MAILCHIMP_FORMS only alongside a consent checkbox.
 * ---------------------------------------------------------------
 */

import { createHash } from "node:crypto";

/* Mailchimp is normally quick, but this function must never hang: being
   killed by the platform is what Netlify counts as a failed delivery. */
const UPSTREAM_TIMEOUT_MS = 8000;
/* A newsletter submission is one email address. */
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_FORMS = "newsletter";

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

/* Netlify is told everything is fine no matter what, on purpose — see the
   header comment. Failures are recorded in the function log instead. */
function ok(note) {
  return new Response(JSON.stringify(note ? { ok: true, note } : { ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const inboundKey = env("MAILCHIMP_INBOUND_KEY");
  if (inboundKey) {
    if (!sameSecret(req.headers.get("x-navren-relay-key") || "", inboundKey)) {
      console.warn("mailchimp-subscribe: refused a request with no or wrong inbound key");
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    console.warn(
      "mailchimp-subscribe: MAILCHIMP_INBOUND_KEY is not set, so this endpoint " +
      "accepts unauthenticated POSTs from anyone who knows its URL"
    );
  }

  const apiKey = env("MAILCHIMP_API_KEY");
  const audienceId = env("MAILCHIMP_AUDIENCE_ID");
  if (!apiKey || !audienceId) {
    /* Never log the values themselves, only which one is missing. */
    console.error(
      "mailchimp-subscribe: not syncing, missing " +
      (!apiKey ? "MAILCHIMP_API_KEY " : "") +
      (!audienceId ? "MAILCHIMP_AUDIENCE_ID" : "")
    );
    return ok("not configured");
  }

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      console.error("mailchimp-subscribe: refused an oversized body,", raw.length, "bytes");
      return ok("oversized");
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.error("mailchimp-subscribe: body was not JSON");
      return ok("unparseable");
    }

    /* Netlify's payload shape has moved between doc revisions, so accept the
       three it has used rather than betting on one. */
    const data = body?.data ?? body?.payload?.data ?? body?.payload ?? body ?? {};
    const formName = String(body?.form_name ?? body?.payload?.form_name ?? data.form_name ?? "").trim();

    const allowed = (env("MAILCHIMP_FORMS") || DEFAULT_FORMS)
      .split(",").map((f) => f.trim()).filter(Boolean);
    if (formName && !allowed.includes(formName)) {
      console.log(`mailchimp-subscribe: ignoring form "${formName}", not in MAILCHIMP_FORMS`);
      return ok("form not synced");
    }

    /* The newsletter honeypot. Netlify filters most spam before a webhook
       ever fires, but a filled honeypot is a free second check. */
    if (String(data.company_url ?? data["bot-field"] ?? "").trim()) {
      console.log("mailchimp-subscribe: honeypot filled, not syncing");
      return ok("honeypot");
    }

    const email = String(data.email ?? body?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      console.warn("mailchimp-subscribe: no usable email address in the submission");
      return ok("no email");
    }

    const dc = apiKey.split("-").pop();
    const hash = createHash("md5").update(email).digest("hex");

    /* status_if_new, not status: this adds new people but will never flip
       someone who previously unsubscribed back to subscribed. */
    const payload = {
      email_address: email,
      status_if_new: env("MAILCHIMP_STATUS") || "pending",
    };
    if (formName) payload.tags = [formName];

    const first = String(data.first ?? "").trim();
    const last = String(data.last ?? "").trim();
    if (first || last) {
      payload.merge_fields = {};
      if (first) payload.merge_fields.FNAME = first;
      if (last) payload.merge_fields.LNAME = last;
    }

    const abort = new AbortController();
    const cutoff = setTimeout(() => abort.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const resp = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${hash}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: abort.signal,
        }
      );
      /* Status only. The response body echoes the subscriber back, and
         function logs are not the place for someone's email address to sit
         indefinitely. */
      if (resp.ok) {
        console.log("mailchimp-subscribe: synced ok,", resp.status);
      } else {
        console.error("mailchimp-subscribe: Mailchimp refused it,", resp.status);
      }
    } finally {
      clearTimeout(cutoff);
    }
  } catch (err) {
    /* err only: the request body is the submission itself. */
    console.error(
      "mailchimp-subscribe: sync failed:",
      err && err.name === "AbortError" ? "Mailchimp timed out" : err
    );
  }

  return ok();
};
