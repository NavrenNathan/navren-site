# navren-site

The Navren Agency website. Hand-written static HTML, CSS and JavaScript — no build
step, no framework, no package manager.

Live at <https://navrenagency.com>, hosted on Netlify.

## Layout

```
*.html          18 pages, all at the root so public URLs stay flat
assets/         style.css and site.js, shared by 15 of the pages
images/         all photography and logos
favicon.*       favicon set, must stay at the root
_headers        security headers and cache policy (Netlify)
_redirects      URL redirects (Netlify)
robots.txt      crawler policy
sitemap.xml     regenerate when pages are added or removed
```

`disclaimers.html`, `privacy.html`, `program-agreement.html` and
`questionnaire.html` are self-contained: they carry their own inline styles and do
not load `assets/style.css`. Changes to the shared stylesheet do not reach them.

## Environment variables

`netlify/functions/sbi-sheet-relay.mjs` forwards Small Business Initiative
signups to the Google Sheet. Its URL and keys used to be literals in that file,
which put them in a public repository, so they are read from the environment
instead. Set these under **Site configuration → Environment variables**:

| Variable | Required | What it is |
| --- | --- | --- |
| `SBI_APPS_SCRIPT_URL` | yes | The Apps Script Web App `/exec` URL |
| `SBI_APPS_SCRIPT_KEY` | yes | The key that URL expects as `?key=` |
| `SBI_RELAY_INBOUND_KEY` | recommended | A value the function requires as an `x-navren-relay-key` header. Set the same value as a custom header on the outgoing form webhook. Without it, anyone who finds the function's URL can write straight into the Sheet. |

Without the first two the function still answers Netlify normally and the
submission is still captured by Netlify Forms — it just does not reach the Sheet,
and says so in the function log.

**The previous values are in git history and must be treated as compromised.**
Redeploy the Apps Script for a new URL and generate a new key rather than reusing
the old ones.

`netlify/functions/mailchimp-subscribe.mjs` copies newsletter signups into a
Mailchimp audience. Netlify Forms remains the system of record; Mailchimp is a
copy, so a failure here loses nothing.

| Variable | Required | What it is |
| --- | --- | --- |
| `MAILCHIMP_API_KEY` | yes | Mailchimp → Account & billing → Extras → API keys. Paste it whole; the trailing `-us21` style suffix is the datacenter and is parsed out of the key. |
| `MAILCHIMP_AUDIENCE_ID` | yes | Mailchimp → Audience → Settings → Audience name and defaults |
| `MAILCHIMP_INBOUND_KEY` | recommended | A value the function requires as `?key=` on the webhook URL (an `x-navren-relay-key` header also works, for curl testing). Netlify's form webhook UI has no custom-header field, only a URL, so the key goes in the query string. Without it, anyone who finds the function's URL can write straight into the audience. |
| `MAILCHIMP_STATUS` | no | `pending` (default) sends a Mailchimp confirmation email and only counts the person once they click. `subscribed` skips that. |
| `MAILCHIMP_FORMS` | no | Comma-separated form names allowed to sync. Defaults to `newsletter` alone. |

Only the `newsletter` form syncs by default, on purpose: it is the only form on
the site where submitting is itself a request for marketing email. `contact`,
`questionnaire` and `small-business-initiative` are people asking a question or
applying to something. Add those to `MAILCHIMP_FORMS` only alongside a consent
checkbox on the form itself.

## Running it locally

Any static server works:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

**Forms will not work this way.** The contact, questionnaire and newsletter forms
are handled by Netlify, and a plain static server answers their POST with a 501 —
so the page reports a failure that is not real. To exercise the forms locally:

```
netlify dev
```

That emulates Netlify's form handling. Otherwise test forms on a deploy preview.

## After editing CSS or JS

`assets/style.css` and `assets/site.js` are linked with a content hash, so a
changed file gets a new URL and returning visitors see it immediately rather
than waiting out the cache. Re-stamp after editing either:

```
./stamp.sh
```

Forgetting it is not fatal, but people who visited recently will keep the old
version for up to an hour.

## Deploying

Netlify builds from `main`, so pushing publishes. A deploy takes about ten
seconds and shows up in the Netlify Deploys tab.

```
git pull        # take whatever is already on main
./stamp.sh      # only if you touched style.css or site.js
git commit -am "..."
git push        # this publishes
```

Always pull before starting work. Continuous deployment removes the risk of one
person's manual upload overwriting another's, but it does not stop two people
editing the same file from different starting points.

## The blog is built but switched off

`blog.html` and `blog-post-template.html` are finished and stay in the repo, but
nothing links to them and `/blog` carries a noindex tag, so the section is not
part of the live site. To turn it back on when the first post is ready:

1. Write the post: duplicate `blog-post-template.html` to `blog-your-title.html`,
   edit the title, description, canonical and body, and remove its noindex tag.
2. In `blog.html`: delete the `.blog-empty` panel, uncomment the filter chips and
   the card rail, point the example card at your post, and remove the noindex tag.
3. Put the Blog link back in the header nav of every page, after About:
   `<li><a class="menu-link" href="blog.html">Blog</a></li>`
4. Put it back in the footer Company column, after Who we help:
   `<li><a href="blog.html">Blog</a></li>`
5. Add `/blog` and the post URL to `sitemap.xml`.

Steps 3 and 4 are one line each across the pages that carry a full nav and
footer, so a find-and-replace across `*.html` is the quickest way to do it.

## Conventions

- Filenames are kebab-case. Spaces and capitals become `%20` in URLs and break links.
- Every image ships a full-size and an `-sm` variant, wired up with `srcset`. Keep
  photographs as JPEG — a 2 MB PNG hero costs far more than it looks like it does.
- Every `<img>` carries `width` and `height` so the page does not shift as it loads.
- Pages stay at the root. Moving them into folders changes every public URL.
