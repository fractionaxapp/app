-- Access during the private beta is granted by hand. Signing in creates the
-- account; it does not admit anyone to the product.
--
-- The default is deliberately the restrictive one, so a row that appears by
-- any route — a login, a webhook, a manual insert — starts with no access
-- rather than full access.

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS access_status text NOT NULL DEFAULT 'waitlisted',
	ADD COLUMN IF NOT EXISTS approved_at   timestamptz;

-- Recreated rather than added conditionally: ADD CONSTRAINT has no IF NOT
-- EXISTS, and dropping first keeps this migration re-runnable.
ALTER TABLE users
	DROP CONSTRAINT IF EXISTS users_access_status_check;

ALTER TABLE users
	ADD CONSTRAINT users_access_status_check
	CHECK (access_status IN ('waitlisted', 'approved', 'declined'));

-- Serves both questions asked of this column: who is waiting, and in what
-- order they arrived.
CREATE INDEX IF NOT EXISTS users_access_status_created_at_idx
	ON users (access_status, created_at);
