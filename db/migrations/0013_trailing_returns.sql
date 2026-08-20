-- Trailing performance, over periods the venue actually states.
--
-- Deliberately not net_yield, and deliberately separate from reported_return.
-- The difference is the whole reason these are worth having: reported_return
-- is a number with no stated basis, while these say the window they cover.
--
-- They are returns on the underlying, not income. A tokenized share of Apple
-- returning 37% over a year did not pay 37%; it went up. Anything that treats
-- these as a coupon would be wrong in the most expensive direction, so the
-- matcher tests them under their own name.

ALTER TABLE offerings
	ADD COLUMN IF NOT EXISTS return_1m  numeric(9,4),
	ADD COLUMN IF NOT EXISTS return_3m  numeric(9,4),
	ADD COLUMN IF NOT EXISTS return_12m numeric(9,4);

-- Sorting and filtering by a year's performance on the discover screen.
CREATE INDEX IF NOT EXISTS offerings_return_12m_idx
	ON offerings (return_12m DESC NULLS LAST) WHERE withdrawn_at IS NULL;
