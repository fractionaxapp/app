# Database

Postgres mirror of the identities Privy authenticates. Privy remains the source
of truth for authentication; these tables are our durable copy, so user data
survives a change of wallet vendor and is available to features that need to
join against it.

## Schema

| Table | Purpose |
| --- | --- |
| `users` | One row per Privy DID, with email/phone/OAuth subject and beta access status |
| `user_wallets` | One row per wallet, embedded or externally connected |
| `login_events` | Append-only login history |

Migrations live in `db/migrations/` and are applied in filename order by
`npm run db:migrate`. Each runs in its own transaction and is recorded in
`_migrations`, so the command is safe to re-run.

## Droplet setup

Run once on the DigitalOcean droplet. Nothing in the app provisions
infrastructure. Each step prints something you can check before moving on.

```bash
# 1 — Install, and confirm the server is up
sudo apt update && sudo apt install -y postgresql
sudo systemctl enable --now postgresql
sudo -u postgres psql -tAc "select version();"

# 2 — Generate the password. Hex, so it needs no escaping inside a URL.
#     Leading space keeps it out of shell history on most shells.
 DB_PASS="$(openssl rand -hex 32)"

# 3 — Role and database. The app user OWNS the database, which is what lets
#     the migration create tables without any further grants.
sudo -u postgres psql <<SQL
CREATE ROLE app_user LOGIN PASSWORD '${DB_PASS}';
CREATE DATABASE app OWNER app_user;
SQL

# 4 — pgcrypto, created by the superuser. The migration asks for it (gen_random_uuid).
#     It is a trusted extension from PG13 on, but creating it here removes the
#     question entirely on older servers.
sudo -u postgres psql -d app -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 5 — Prove the app user can connect and create, before the app depends on it
PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U app_user -d app -tAc \
  "create table _probe(x int); drop table _probe; select 'app_user ok';"

# 6 — Point the app at it. DATABASE_URL is read at RUNTIME, so this needs a
#     restart but not a rebuild.
cd /srv/app                                   # wherever the app is deployed
grep -c '^DATABASE_URL=' .env.local || true   # 0 means safe to append
printf 'DATABASE_URL=postgres://app_user:%s@127.0.0.1:5432/app\n' "$DB_PASS" >> .env.local

# 7 — Create the tables
npm run db:migrate        # expect: Applied 0001_users.sql, 0002_access.sql

# 8 — Restart and watch it come up clean
pm2 restart app && pm2 logs app --lines 20 --nostream

 unset DB_PASS
```

If step 6 printed `1` rather than `0`, there is already a `DATABASE_URL` line —
edit it in place instead of appending, or the second one wins and you will spend
an hour wondering why.

### Confirm it works end to end

The sync endpoint answers `401` to an unauthenticated request whether or not the
database is reachable — the authentication check deliberately runs first, so it
leaks nothing about how the backend is provisioned. That makes `curl` useless
here. Sign in on the site instead, then look for the row:

```bash
sudo -u postgres psql -d app -c \
  "SELECT email, access_status, created_at FROM users ORDER BY created_at DESC LIMIT 5;"
```

A row means Privy, the sync endpoint and Postgres are all talking. No row means
the login never reached the database — check `pm2 logs app` for
`Failed to mirror Privy user into Postgres`.

### Do not expose Postgres to the internet

A stock install listens on localhost only. Keep it that way. Reach it from the
app over one of:

- the droplet's **private network** (VPC), with `listen_addresses` set to the
  private IP and `pg_hba.conf` restricted to the app server's private address;
- an **SSH tunnel** for local development:
  `ssh -L 5432:localhost:5432 user@droplet`.

Step 6 above writes the localhost form. Over a VPC, swap the host for the
database server's private address.

`DATABASE_SSL` stays unset for a plaintext connection over a private network or
tunnel. Once you terminate TLS on Postgres itself, set `DATABASE_SSL=true`, and
add `DATABASE_SSL_STRICT=true` only when the certificate chain is verifiable —
a self-signed certificate will fail strict verification.

### Hosted Postgres

If `DATABASE_URL` points at a managed provider (Neon, Supabase, a DO managed
cluster) rather than the droplet, none of the SQL in this file changes — only
how you reach it. Use the connection string instead of a local superuser:

```bash
psql "$DATABASE_URL" -c "SELECT email, access_status FROM users ORDER BY created_at DESC LIMIT 5;"
```

Leave `DATABASE_SSL` unset. Managed providers put `sslmode=require` in the
connection string and `pg` reads it, so setting `DATABASE_SSL=true` without
`DATABASE_SSL_STRICT=true` would override a verified connection with an
unverified one — the wrong direction.

Prefer `sslmode=verify-full` in the URL where the provider supports it. `pg`
treats `require` as `verify-full` today and warns that it will stop doing so in
v9, at which point a URL saying `require` would quietly stop checking the
certificate.

### Connection limits

Postgres defaults to 100 connections shared across everything on the box. The
pool caps the app at `DATABASE_POOL_MAX` (default 10). If you run several app
instances, keep the sum comfortably below `max_connections`.

## Applying migrations

```bash
npm run db:migrate
```

Reads `DATABASE_URL` from `.env.local`. Run it against the droplet before
deploying code that depends on a new table.

## Admitting someone to the private beta

Signing in creates an account; it does not grant access. Every row starts at
`waitlisted` and the dashboard shows the queue screen until it says `approved`.

### From the screen

`/dashboard/admin` lists the queue longest-wait first, with Admit, Decline and
Revoke on each row, and records every change in `access_changes` against the
administrator who made it.

Who may open it comes from the environment, never from the database — a flag in
a table can be flipped by anything that can write to the table, including the
product itself:

```bash
ADMIN_EMAILS=you@example.com,partner@example.com
# or, stable across an address change (the "Account ID" on the profile screen):
ADMIN_PRIVY_DIDS=did:privy:clxxxx
```

With neither set there are no administrators and the screen renders nothing to
anyone. Both are read per request, so adding one takes a restart rather than a
rebuild. Administrators do not need to be admitted themselves, which is what
makes the first admission possible.

### From psql

Still the fastest route when you are already in a shell, and the only route
before the first administrator is named.

See who is waiting, longest first:

```sql
SELECT email, created_at, last_login_at
FROM users
WHERE access_status = 'waitlisted'
ORDER BY created_at;
```

Admit one:

```sql
UPDATE users
SET access_status = 'approved', approved_at = now()
WHERE email = 'someone@example.com';
```

Turn one down. The account keeps its row and its history, and the dashboard
tells them plainly rather than leaving them queuing forever:

```sql
UPDATE users SET access_status = 'declined' WHERE email = 'someone@example.com';
```

Revoking access is the same statement with `'waitlisted'`. Nothing else needs
doing — the dashboard reads this column on every request, so the change takes
effect on their next page load.

**The default is restrictive on purpose.** A row that appears by any route —
login, webhook, manual insert — starts with no access. If the database is
unreachable, or a login has not yet been mirrored, the app treats the account
as waiting rather than as admitted.

## Deal sourcing

Three tables carry it. `sources` is the venues to read, `offerings` is what
they published, `mandates` is what each account is looking for. There is no
results table: matching is done on read, so a result can never be stale
relative to the index.

### Adding a venue

Administration → Sources, or a row in `sources`. A venue needs an endpoint that
returns JSON or an RSS/Atom feed, plus — for JSON — a mapping saying where each
field lives in their payload:

```json
{
  "items": "data.offerings",
  "externalId": "id",
  "title": "name",
  "netYield": "terms.apy",
  "termMonths": "terms.months",
  "minimum": "terms.min_investment"
}
```

Left empty, the adapter tries the obvious names and leaves the rest null. Null
is not zero here: the matcher reports an absent field as unverifiable rather
than as a failure, and those offerings are shown separately from both the
matches and the exclusions.

A venue that publishes only HTML needs a parser written against its markup.
That is a per-venue job and deliberately not guessed at — invented selectors
produce wrong numbers silently, which is the worst way for this to fail.

### Running the crawl

```bash
curl -X POST https://fractionax.app/api/cron/crawl \
  -H "Authorization: Bearer $CRON_SECRET"
```

Hourly from cron on the droplet:

```cron
17 * * * * curl -fsS -X POST http://127.0.0.1:3000/api/cron/crawl -H "Authorization: Bearer THE_SECRET" >/dev/null
```

The same code runs behind the Run buttons on the Sources screen, so a crawl
started by hand and one started by cron behave identically.

### What the crawler does to other people's servers

robots.txt is fetched per origin and obeyed — a disallowed URL is not read, and
the source records that as its error. Requests carry a user agent that names us
and links to the site, time out at 15 seconds, stop at 5 MB, and venues are
crawled one at a time rather than in parallel. The add-a-venue form refuses
private and loopback addresses, so the crawler cannot be pointed at whatever
the app server can reach on its own network.
