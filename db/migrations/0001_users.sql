-- Mirror of the identities Privy authenticates, kept in our own Postgres so
-- user data survives a change of wallet vendor and is available to features
-- that need to join against it.
--
-- Privy remains the source of truth for authentication; this is a durable
-- copy, written on login and by the Privy webhook.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
	id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	-- Privy's decentralised identifier, e.g. did:privy:clxxxx. Stable for the
	-- lifetime of the account and the key we upsert on.
	privy_did       text        NOT NULL UNIQUE,
	email           text,
	phone           text,
	-- Whichever social provider was linked, e.g. 'google', 'apple'.
	oauth_provider  text,
	oauth_subject   text,
	created_at      timestamptz NOT NULL DEFAULT now(),
	updated_at      timestamptz NOT NULL DEFAULT now(),
	last_login_at   timestamptz
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));

-- One row per wallet, embedded or externally connected. A user may hold
-- several across chains, so this is deliberately not a column on users.
CREATE TABLE IF NOT EXISTS user_wallets (
	id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id            uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	address            text        NOT NULL,
	-- 'ethereum' | 'solana' | 'bitcoin' | ...
	chain_type         text        NOT NULL,
	-- 'privy' for embedded wallets, otherwise the connector, e.g. 'metamask'.
	wallet_client_type text,
	is_embedded        boolean     NOT NULL DEFAULT false,
	created_at         timestamptz NOT NULL DEFAULT now(),
	UNIQUE (address, chain_type)
);

CREATE INDEX IF NOT EXISTS user_wallets_user_id_idx ON user_wallets (user_id);

-- Append-only login history. Useful for support, fraud review and for
-- measuring how many users are actually active, which is what wallet vendors
-- bill on.
CREATE TABLE IF NOT EXISTS login_events (
	id          bigserial   PRIMARY KEY,
	user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	-- 'email' | 'google' | 'wallet' | ...
	method      text,
	ip          inet,
	user_agent  text,
	occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_user_id_occurred_at_idx
	ON login_events (user_id, occurred_at DESC);
