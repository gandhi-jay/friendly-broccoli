#!/bin/bash
set -e

PAGES_REPO="~/git/gandhi-jay.github.io"

if [ ! -d "$PAGES_REPO" ]; then
  echo "Error: $PAGES_REPO not found."
  exit 1
fi

cp yt-embed.html "$PAGES_REPO/yt-embed.html"

cd "$PAGES_REPO"
git add yt-embed.html
git commit -m "Update yt-embed.html"
git push

echo ""
echo "✅ Deployed! Available at:"
echo "   https://www.gandhijay.com/yt-embed.html"
