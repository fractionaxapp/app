-- Deal sourcing: where offerings come from, what was found, and what each
-- account is looking for.
--
-- Three tables and no cached results. Matching a mandate against the index is
-- cheap and is done on read, so a result can never be stale relative to what
-- was crawled — which matters more here than the milliseconds saved, because
-- the whole claim is that the index is current.

CREATE TABLE IF NOT EXISTS sources (
	id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	slug        text        NOT NULL UNIQUE,
	label       text        NOT NULL,
	-- How to read this endpoint. 'json' for an API, 'rss' for a feed.
	kind        text        NOT NULL,
	url         text        NOT NULL,
	-- Where each of our fields lives in their payload, e.g.
	-- {"items": "data.offerings", "net_yield": "terms.apy"}.
	mapping     jsonb       NOT NULL DEFAULT '{}'::jsonb,
	enabled     boolean     NOT NULL DEFAULT true,
	-- Outcome of the last crawl, so a source that has been failing quietly for
	-- a week is visible rather than merely absent from the results.
	last_run_at timestamptz,
	last_status text,
	last_error  text,
	last_count  integer,
	created_at  timestamptz NOT NULL DEFAULT now(),
	updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_kind_check;
ALTER TABLE sources ADD CONSTRAINT sources_kind_check
	CHECK (kind IN ('json', 'rss'));

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_last_status_check;
ALTER TABLE sources ADD CONSTRAINT sources_last_status_check
	CHECK (last_status IS NULL OR last_status IN ('ok', 'error'));

-- One row per offering per venue. Fields are nullable on purpose: a venue that
-- does not publish a DSCR leaves it null, and null must stay distinguishable
-- from zero — the matcher treats it as "cannot verify" rather than "fails".
CREATE TABLE IF NOT EXISTS offerings (
	id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	source_id    uuid        NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
	-- The venue's own identifier, and the key we upsert on.
	external_id  text        NOT NULL,
	url          text,
	title        text        NOT NULL,
	issuer       text,
	asset_class  text,
	currency     text,
	-- Percent, e.g. 9.200 for 9.2%.
	net_yield    numeric(7,3),
	term_months  integer,
	seniority    text,
	minimum      numeric(18,2),
	jurisdiction text,
	dscr         numeric(7,2),
	-- Exactly what the venue returned, kept so a mapping can be corrected
	-- later without re-crawling, and so a disputed field can be checked.
	raw          jsonb       NOT NULL DEFAULT '{}'::jsonb,
	first_seen   timestamptz NOT NULL DEFAULT now(),
	last_seen    timestamptz NOT NULL DEFAULT now(),
	-- Set when a crawl no longer finds it. Never deleted: an offering that
	-- vanished is a fact about the venue worth keeping.
	withdrawn_at timestamptz,
	UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS offerings_live_idx
	ON offerings (withdrawn_at, net_yield DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS offerings_source_idx ON offerings (source_id);

-- What an account is looking for: the sentence they wrote, and the criteria
-- read out of it. Both are kept — the sentence is what they meant, the
-- criteria are what we acted on, and being able to compare the two is the
-- only way to tell when the parse was wrong.
CREATE TABLE IF NOT EXISTS mandates (
	id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	statement   text        NOT NULL,
	criteria    jsonb       NOT NULL DEFAULT '{}'::jsonb,
	-- 'claude' or 'rules', so a surprising parse can be attributed.
	parsed_by   text        NOT NULL DEFAULT 'rules',
	created_at  timestamptz NOT NULL DEFAULT now(),
	archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS mandates_user_idx
	ON mandates (user_id, archived_at, created_at DESC);
