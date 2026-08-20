-- What an account decided about an offering, and why.
--
-- The system does not decide. It reports what the venue published, what is
-- missing, and what cannot be checked; a person reads that and records a
-- verdict here. Keeping the note beside the verdict is the point — a decision
-- without its reasoning is not worth revisiting.
--
-- One row per account per offering: the current position, not a history. The
-- note is where a change of mind gets explained.

CREATE TABLE IF NOT EXISTS underwriting (
	id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	offering_id uuid        NOT NULL REFERENCES offerings (id) ON DELETE CASCADE,
	verdict     text        NOT NULL,
	note        text,
	created_at  timestamptz NOT NULL DEFAULT now(),
	updated_at  timestamptz NOT NULL DEFAULT now(),
	UNIQUE (user_id, offering_id)
);

ALTER TABLE underwriting DROP CONSTRAINT IF EXISTS underwriting_verdict_check;

ALTER TABLE underwriting ADD CONSTRAINT underwriting_verdict_check
	CHECK (verdict IN ('accepted', 'watching', 'rejected'));

CREATE INDEX IF NOT EXISTS underwriting_user_idx
	ON underwriting (user_id, verdict, updated_at DESC);
