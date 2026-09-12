/* ============================================================
   Blog password gate
   Sits in front of every /blog* path (the listing and every post) and
   requires a password before the real page is served. Everything else on
   the site is untouched. This is for an internal preview: employees can see
   what's being worked on before it goes fully public, without opening it up
   to search or to anyone who finds the URL.

   BLOG_GATE_PASSWORD and BLOG_GATE_SECRET are set as Netlify environment
   variables, not hardcoded here, so the password is not sitting in git
   history. The cookie stores a hash of the two rather than the password
   itself, so a visitor can't just guess a cookie value and let themselves
   in. To remove the gate later: delete this file (and the [[edge_functions]]
   block in netlify.toml), or unpublish it - no changes needed to blog.html
   or the post pages.
   ============================================================ */

const COOKIE = "nv_blog_auth";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function gatePage({ error } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Blog preview | Navren</title>
<link rel="preload" href="/fonts/karla-400-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/assets/style.css" />
<style>
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--paper);padding:20px;}
  .gate{max-width:360px;width:100%;background:var(--white);border:1px solid var(--line);border-radius:9px;padding:32px 28px;text-align:center;}
  .gate img{height:22px;width:auto;margin-bottom:22px;}
  .gate h1{font-family:var(--display);font-weight:700;font-size:20px;letter-spacing:-.018em;margin-bottom:8px;}
  .gate p{color:var(--slate);font-size:14.5px;line-height:1.55;margin-bottom:20px;}
  .gate input[type=password]{width:100%;min-height:46px;padding:0 14px;font-family:var(--body);font-size:15px;color:var(--ink);border:1px solid var(--line);border-radius:6px;margin-bottom:12px;}
  .gate input[type=password]:focus-visible{outline:2px solid var(--jade);outline-offset:1px;}
  .gate button{width:100%;min-height:46px;border:0;border-radius:6px;background:var(--jade);color:#fff;font-family:var(--body);font-weight:700;font-size:15px;cursor:pointer;transition:background .2s ease;}
  .gate button:hover{background:var(--jade-deep);}
  .gate .err{color:#B23B3B;font-size:13.5px;margin-bottom:14px;}
</style>
</head>
<body>
  <div class="gate">
    <img src="/images/navren-logo.png" alt="Navren" />
    <h1>Blog preview</h1>
    <p>This section is being reviewed internally before it goes fully live. Enter the password to continue.</p>
    ${error ? `<p class="err">${error}</p>` : ""}
    <form method="POST">
      <input type="password" name="password" placeholder="Password" autofocus required />
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}

function html(body, status) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export default async (request, context) => {
  const password = Netlify.env.get("BLOG_GATE_PASSWORD");
  const secret = Netlify.env.get("BLOG_GATE_SECRET");

  if (!password || !secret) {
    // Misconfigured (env vars missing) - fail closed rather than let anyone in.
    return html(gatePage({ error: "This section is temporarily unavailable." }), 503);
  }

  const validToken = await sha256Hex(password + secret);

  if (request.method === "POST") {
    const form = await request.formData();
    if (form.get("password") === password) {
      const headers = new Headers({ location: request.url });
      headers.append(
        "set-cookie",
        `${COOKIE}=${validToken}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
      );
      return new Response(null, { status: 303, headers });
    }
    return html(gatePage({ error: "Wrong password." }), 401);
  }

  if (getCookie(request, COOKIE) === validToken) {
    return context.next();
  }

  return html(gatePage(), 401);
};

export const config = { path: "/blog*" };
