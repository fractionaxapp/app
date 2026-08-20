-- Everything else a venue publishes about an offering.
--
-- The complete payload has always been kept in offerings.raw, which is the
-- record of what we were told. These columns are the part of it worth querying
-- and showing: raw answers "what did they say", a column answers "show me
-- everything under 100,000 on Ethereum".
--
-- All nullable, because no venue publishes all of them and a missing field must
-- stay distinguishable from a zero. The matcher reads a null as "cannot
-- verify", never as a failure.

ALTER TABLE offerings
	-- Ticker or short code, e.g. USYC.
	ADD COLUMN IF NOT EXISTS symbol                 text,
	-- The issuance platform, where that differs from the manager.
	ADD COLUMN IF NOT EXISTS platform               text,
	-- Chains it is issued on.
	ADD COLUMN IF NOT EXISTS networks               text[],
	-- e.g. "Bermuda Limited Company", "Delaware LLC".
	ADD COLUMN IF NOT EXISTS fund_structure         text,
	ADD COLUMN IF NOT EXISTS subscription_frequency text,
	ADD COLUMN IF NOT EXISTS redemption_frequency   text,
	-- e.g. accumulating, distributing.
	ADD COLUMN IF NOT EXISTS income_treatment       text,
	-- Who may hold it, as the venue describes them.
	ADD COLUMN IF NOT EXISTS investor_types         text[],
	ADD COLUMN IF NOT EXISTS aum                    numeric(24,2),
	ADD COLUMN IF NOT EXISTS holders_count          integer,
	ADD COLUMN IF NOT EXISTS management_fee         numeric(7,3),
	ADD COLUMN IF NOT EXISTS performance_fee        numeric(7,3),
	ADD COLUMN IF NOT EXISTS subscription_fee       numeric(7,3),
	ADD COLUMN IF NOT EXISTS redemption_fee         numeric(7,3),
	-- Left as text: venues write this as 5/1/2023 with no stated convention,
	-- and guessing between May and January would invent a fact.
	ADD COLUMN IF NOT EXISTS inception              text,
	ADD COLUMN IF NOT EXISTS description            text,
	/*
	 * A return figure as the venue reports it, with no stated basis —
	 * annualised, trailing thirty days, since inception, nobody says.
	 *
	 * Deliberately NOT net_yield. It is kept because it is worth having and
	 * discarding it would lose data, and it is named this way so that nothing
	 * can quietly treat it as a yield an investor could be shown. The matcher
	 * does not read it.
	 */
	ADD COLUMN IF NOT EXISTS reported_return        numeric(9,4);

-- The filters the sourcing table offers.
CREATE INDEX IF NOT EXISTS offerings_asset_class_idx
	ON offerings (asset_class) WHERE withdrawn_at IS NULL;

CREATE INDEX IF NOT EXISTS offerings_jurisdiction_idx
	ON offerings (jurisdiction) WHERE withdrawn_at IS NULL;
