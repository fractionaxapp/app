# Database

Postgres mirror of the identities Privy authenticates. Privy remains the source
of truth for authentication; these tables are our durable copy, so user data
survives a change of wallet vendor and is available to features that need to
join against it.

## Schema

| Table | Purpose |
| --- | --- |
| `users` | One row per Privy DID, with email/phone/OAuth subject |
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
