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

`disclaimers.html`, `privacy.html` and `questionnaire.html` are self-contained:
they carry their own inline styles and do not load `assets/style.css`. Changes to
the shared stylesheet do not reach them.

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

## Deploying

Netlify is not currently linked to this repository, so pushing to `main` does not
publish. Deploys are run manually:

```
git pull                       # take whatever is already on main
netlify deploy --prod --dir .
```

Always pull first. A manual deploy uploads a full snapshot and replaces the live
site with it, so deploying from a stale checkout silently reverts anyone else's
work that has not been pulled in.

Linking the repository in Netlify (Site configuration → Build & deploy) removes
this problem entirely and is worth doing. It requires admin on both the GitHub
repository and the Netlify site.

## Conventions

- Filenames are kebab-case. Spaces and capitals become `%20` in URLs and break links.
- Every image ships a full-size and an `-sm` variant, wired up with `srcset`. Keep
  photographs as JPEG — a 2 MB PNG hero costs far more than it looks like it does.
- Every `<img>` carries `width` and `height` so the page does not shift as it loads.
- Pages stay at the root. Moving them into folders changes every public URL.
