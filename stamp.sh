#!/bin/bash
# Stamps assets/style.css and assets/site.js with a short content hash so a
# changed file gets a new URL. Returning visitors pick up changes on the next
# load instead of waiting out the one-hour cache. Re-run after editing either.
cd "$(dirname "$0")"
css=$(md5 -q assets/style.css | cut -c1-8)
js=$(md5 -q assets/site.js | cut -c1-8)
for f in *.html; do
  [ "$f" = "font-preview.html" ] && continue
  perl -pi -e "s{assets/style\.css(\?v=[a-f0-9]+)?}{assets/style.css?v=$css}g" "$f"
  perl -pi -e "s{assets/site\.js(\?v=[a-f0-9]+)?}{assets/site.js?v=$js}g" "$f"
done
echo "  stamped css=$css js=$js across $(ls *.html | grep -v font-preview | wc -l | tr -d ' ') pages"
