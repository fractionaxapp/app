# Deploying to the droplet

The app runs under PM2; Postgres runs under systemd. Database setup is covered
separately in [db/README.md](db/README.md).

## Environment variables: build time vs runtime

This trips people up, so it is worth stating plainly.

**`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle when you run
`npm run build`.** Setting them in PM2, in the shell before `next start`, or in
`ecosystem.config.cjs` has no effect — the value is already baked in. They must
be present in the environment *at build time*.

| Variable | Needed at | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **build** | Canonical URLs, OG images, sitemap, robots |
| `NEXT_PUBLIC_PRIVY_APP_ID` | **build** | An invalid value **fails the build** — Privy validates the format while prerendering `/dashboard` |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | **build** | |
| `NEXT_PUBLIC_GA_ID` | **build** | Unset disables analytics entirely |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | **build** | Optional |
| `PRIVY_APP_SECRET` | runtime | Server-only. Never expose |
| `DATABASE_URL` | runtime | Server-only |
| `DATABASE_SSL`, `DATABASE_SSL_STRICT`, `DATABASE_POOL_MAX` | runtime | Optional |

Keep everything in `.env.local` on the droplet. Next loads it for both `next
build` and `next start`, so a single file covers both columns. It is gitignored;
copy `.env.example` and fill it in.

Because the public values are baked into the bundle, **changing any of them
requires a rebuild**, not just a restart.

## First deploy

```bash
# On the droplet, in the project directory
npm ci
cp .env.example .env.local && "$EDITOR" .env.local

npm run db:migrate        # applies db/migrations against DATABASE_URL
npm run build

npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 startup && pm2 save   # restart on reboot
```

`pm2 startup` prints a command to run with `sudo` — run it, then `pm2 save`.

## Updating

```bash
git pull
npm ci
npm run db:migrate        # no-op when there is nothing new
npm run build
pm2 reload app
```

`pm2 reload` waits for in-flight requests rather than dropping them; the ten
second `kill_timeout` in the ecosystem file gives the server time to drain.

Run migrations **before** starting code that depends on a new table. Migrations
are forward-only and recorded in `_migrations`, so re-running is safe.

## Reverse proxy and TLS

Do not expose port 3000 directly. Terminate TLS in front of the app — Caddy is
the least effort:

```
your-domain.com {
	reverse_proxy 127.0.0.1:3000
}
```

Then bind the app to localhost only, and set `NEXT_PUBLIC_SITE_URL` to the
public HTTPS origin so canonical URLs, OG images and the sitemap are correct.

Make sure the proxy forwards `X-Forwarded-For`; `/api/auth/sync` reads it to
record the client IP on login events, and both Caddy and nginx's
`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` do this.

## Operating

```bash
pm2 status
pm2 logs app            # tail application logs
pm2 monit               # live CPU/memory
pm2 restart app         # hard restart
pm2 reload app          # graceful
```

Logs default to `~/.pm2/logs/`. Postgres logs live in the journal:
`journalctl -u postgresql`.

## Health checks

After a deploy:

```bash
curl -sI https://your-domain.com/            | head -1   # 200
curl -s  https://your-domain.com/robots.txt              # sitemap URL correct?
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
     https://your-domain.com/api/auth/sync               # 401 when signed out
```

That last one matters: `401` confirms the session boundary is live. A `503`
means `PRIVY_APP_SECRET` is missing from the runtime environment.
