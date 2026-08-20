-- Policy limits, and the allocations an account intends or has made.
--
-- Nothing here settles anything. There is no custody in this product and no
-- venue API behind it, so an allocation is a decision plus a record of what
-- was actually done at the venue — entered by the person who did it.
--
-- Writing that down is still worth doing. The limits are checked before an
-- allocation is planned rather than after it is regretted, and a plan that
-- breaches one is refused with the reason.

CREATE TABLE IF NOT EXISTS policies (
	user_id            uuid        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
	-- The largest single allocation this account will make.
	max_per_allocation numeric(18,2),
	-- The most it will commit across everything.
	max_total          numeric(18,2),
	-- The currency the two figures above are stated in.
	currency           text        NOT NULL DEFAULT 'USD',
	updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allocations (
	id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	offering_id uuid        NOT NULL REFERENCES offerings (id) ON DELETE CASCADE,
	amount      numeric(18,2) NOT NULL,
	currency    text        NOT NULL,
	-- 'planned' until someone says it happened; 'cancelled' if it did not.
	status      text        NOT NULL DEFAULT 'planned',
	-- Whatever identifies it at the venue: an order id, a tx hash, a note.
	reference   text,
	note        text,
	created_at  timestamptz NOT NULL DEFAULT now(),
	updated_at  timestamptz NOT NULL DEFAULT now(),
	executed_at timestamptz
);

ALTER TABLE allocations DROP CONSTRAINT IF EXISTS allocations_status_check;

ALTER TABLE allocations ADD CONSTRAINT allocations_status_check
	CHECK (status IN ('planned', 'executed', 'cancelled'));

ALTER TABLE allocations DROP CONSTRAINT IF EXISTS allocations_amount_check;

ALTER TABLE allocations ADD CONSTRAINT allocations_amount_check
	CHECK (amount > 0);

CREATE INDEX IF NOT EXISTS allocations_user_idx
	ON allocations (user_id, status, updated_at DESC);
