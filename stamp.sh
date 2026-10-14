#!/bin/bash
# Stamps every file in assets/ with a short content hash so a changed file
# gets a new URL. Returning visitors pick up changes on the next load instead
# of waiting out the cache. Re-run after editing any asset.
cd "$(dirname "$0")"
for a in assets/*; do
  name=$(basename "$a")
  hash=$(md5 -q "$a" | cut -c1-8)
  re=$(printf '%s' "$name" | sed 's/\./\\./g')
  for f in *.html; do
    [ "$f" = "font-preview.html" ] && continue
    perl -pi -e "s{assets/$re(\?v=[a-f0-9]+)?}{assets/$name?v=$hash}g" "$f"
  done
  echo "  $name=$hash"
done
echo "  stamped across $(ls *.html | grep -v font-preview | wc -l | tr -d ' ') pages"
