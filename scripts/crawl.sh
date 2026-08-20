#!/bin/sh
#
# Fires the scheduled crawl against a running app.
#
# The secret is read from .env.local rather than written into the crontab, so
# rotating it is one edit in one place and `crontab -l` does not print it.
#
# Nothing here treats an unreachable app as a failure. On a laptop the server
# is often not running, and an hourly job that shouts about that is one you
# learn to ignore — which is how a real failure gets missed.
set -eu

cd "$(dirname "$0")/.."

SECRET=$(grep '^CRON_SECRET=' .env.local 2>/dev/null | cut -d= -f2- || true)
[ -n "${SECRET:-}" ] || exit 0

URL="${CRAWL_URL:-http://localhost:3000/api/cron/crawl}"

printf '%s ' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

curl -fsS -m 900 -X POST "$URL" -H "Authorization: Bearer $SECRET" ||
	printf 'no answer from %s' "$URL"

printf '\n'
