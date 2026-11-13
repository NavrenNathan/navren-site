#!/usr/bin/env python3
"""Writes the schema.org JSON-LD into every public page.

Re-run after editing a page's title, meta description or FAQ:

    python3 schema.py

Each page gets one block between <!-- schema:start --> and <!-- schema:end -->
in its <head>, rebuilt from scratch on every run, so the output never drifts
from what the page shows. FAQ answers in particular are read from the page's
own <details> elements, because Google requires FAQ schema to match the
visible text exactly. Standard library only.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = "https://navrenagency.com"
ORG_ID = SITE + "/#org"

# Facts already published on the site (homepage and contact page).
ORG = {
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    "name": "Navren Agency, LLC",
    "alternateName": "Navren",
    "url": SITE + "/",
    "logo": SITE + "/images/navren-logo.png",
    "image": SITE + "/images/og-navren.jpg",
    "email": "hello@navrenagency.com",
    "description": "A marketing agency for startups and entrepreneurs. We help ambitious companies find their market, build demand, and scale.",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "11900 N.E. 1st Street, Suite 300, Building G",
        "addressLocality": "Bellevue",
        "addressRegion": "WA",
        "postalCode": "98005",
        "addressCountry": "US",
    },
    "sameAs": [
        "https://www.linkedin.com/company/navren-agency/",
        "https://www.instagram.com/navrenagency/",
        "https://www.facebook.com/navrenagency",
        "https://www.reddit.com/user/NavrenAgency/",
    ],
}

# page -> (breadcrumb label, parent page or None)
PAGES = {
    "about": ("About", None),
    "approach": ("Approach", None),
    "blog": ("Blog", None),
    "blog-you-dont-need-to-go-viral": ("You Don't Need to Go Viral", "blog"),
    "blog-dont-be-camera-shy": ("Don't Be Camera Shy", "blog"),
    "contact": ("Contact", None),
    "questionnaire": ("Questionnaire", None),
    "services": ("Services", None),
    "strategy": ("Strategy", "services"),
    "communications": ("Communications", "services"),
    "search": ("Search", "services"),
    "content": ("Website & Content", "services"),
    "email": ("Email & Retention", "services"),
    "who-we-help": ("Who we help", None),
    "startups": ("Technology & Startups", "who-we-help"),
    "commerce": ("Commerce & Consumer", "who-we-help"),
    "professional-services": ("Professional Services", "who-we-help"),
    "local-business": ("Local & Service", "who-we-help"),
    "small-business-initiative": ("Small Business Initiative", None),
    "small-business-initiative-join": ("Join", "small-business-initiative"),
}
SERVICES = {"strategy", "communications", "search", "content", "email"}
POSTS = {
    "blog-dont-be-camera-shy": {
        "published": "2026-11-13",
        "modified": "2026-11-13",
        "image": SITE + "/images/blog-dont-be-camera-shy-cover.jpg",
    },
    "blog-you-dont-need-to-go-viral": {
        "published": "2026-09-11",
        "modified": "2026-11-10",
        "image": SITE + "/images/blog-you-dont-need-to-go-viral-cover.jpg",
    },
}


def url(page):
    return SITE + "/" if page == "index" else f"{SITE}/{page}"


def text(fragment):
    """Visible text of an HTML fragment, whitespace collapsed."""
    fragment = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def meta(src, name):
    m = re.search(rf'<meta name="{name}" content="([^"]*)"', src)
    return html.unescape(m.group(1)) if m else None


def breadcrumbs(page):
    chain = []
    p = page
    while p:
        label, parent = PAGES[p]
        chain.insert(0, (label, url(p)))
        p = parent
    chain.insert(0, ("Home", url("index")))
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i, "name": n, "item": u}
            for i, (n, u) in enumerate(chain, 1)
        ],
    }


def faq(src):
    qa = []
    for block in re.findall(r'class="faq[^"]*"[^>]*>(.*?)(?=<div class="faq|</section>)', src, re.S):
        for q, a in re.findall(
            r"<summary>(.*?)</summary>\s*<div class=\"answer\">(.*?)</div>", block, re.S
        ):
            qa.append((text(q), text(a)))
    if not qa:
        return None
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in qa
        ],
    }


def graph_for(page, src):
    g = []
    if page in ("index", "contact"):
        g.append(ORG)
    if page != "index":
        g.append(breadcrumbs(page))
    if page in SERVICES:
        g.append({
            "@type": "Service",
            "name": PAGES[page][0],
            "description": meta(src, "description"),
            "url": url(page),
            "provider": {"@type": "Organization", "@id": ORG_ID,
                         "name": ORG["name"], "url": ORG["url"]},
        })
    if page in POSTS:
        p = POSTS[page]
        h1 = text(re.search(r"<h1[^>]*>(.*?)</h1>", src, re.S).group(1))
        org = {"@type": "Organization", "@id": ORG_ID, "name": "Navren", "url": ORG["url"],
               "logo": {"@type": "ImageObject", "url": ORG["logo"]}}
        g.append({
            "@type": "BlogPosting",
            "headline": h1,
            "description": meta(src, "description"),
            "image": p["image"],
            "datePublished": p["published"],
            "dateModified": p["modified"],
            "author": org,
            "publisher": org,
            "mainEntityOfPage": url(page),
        })
    f = faq(src)
    if f:
        g.append(f)
    return g


def main():
    start, end = "<!-- schema:start -->", "<!-- schema:end -->"
    for page in ["index", *PAGES]:
        path = ROOT / f"{page}.html"
        src = path.read_text()
        # the hand-written LocalBusiness block this script replaced
        src = re.sub(r'<script type="application/ld\+json">\s*\{\s*"@context": "https://schema.org",\s*"@type": "LocalBusiness".*?</script>\n?',
                     "", src, flags=re.S)
        src = re.sub(rf"{start}.*?{end}\n?", "", src, flags=re.S)
        data = {"@context": "https://schema.org", "@graph": graph_for(page, src)}
        block = (f"{start}\n<script type=\"application/ld+json\">\n"
                 f"{json.dumps(data, indent=2, ensure_ascii=False)}\n</script>\n{end}\n")
        src = src.replace("</head>", block + "</head>", 1)
        path.write_text(src)
        types = ", ".join(n["@type"] for n in data["@graph"])
        print(f"  {page}: {types}")


if __name__ == "__main__":
    main()
