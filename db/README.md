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

These steps are run once on the DigitalOcean droplet. Nothing in the app
provisions infrastructure.

```bash
# On the droplet
sudo apt update && sudo apt install -y postgresql
sudo -u postgres psql -c "CREATE DATABASE app;"
sudo -u postgres psql -c "CREATE USER app_user WITH PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE app TO app_user;"
# The migration needs to create extensions and tables in the public schema:
sudo -u postgres psql -d app -c "GRANT ALL ON SCHEMA public TO app_user;"
```

### Do not expose Postgres to the internet

A stock install listens on localhost only. Keep it that way. Reach it from the
app over one of:

- the droplet's **private network** (VPC), with `listen_addresses` set to the
  private IP and `pg_hba.conf` restricted to the app server's private address;
- an **SSH tunnel** for local development:
  `ssh -L 5432:localhost:5432 user@droplet`.

Then set in `.env.local`:

```
DATABASE_URL=postgres://app_user:CHANGE_ME@localhost:5432/app
```

`DATABASE_SSL` stays unset for a plaintext connection over a private network or
tunnel. Once you terminate TLS on Postgres itself, set `DATABASE_SSL=true`, and
add `DATABASE_SSL_STRICT=true` only when the certificate chain is verifiable —
a self-signed certificate will fail strict verification.

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
There is no admin UI yet — this is done in psql.

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
