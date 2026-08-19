-- Questions asked from the landing page.
--
-- The contact dialog used to hand off to a mailto:, which is honest but loses
-- every question from someone without a mail client configured — and leaves no
-- record of what was asked. These rows are that record.
--
-- Deliberately not joined to users: the whole point is that these arrive from
-- people who have not signed in, and most never will.

CREATE TABLE IF NOT EXISTS enquiries (
	id         bigserial   PRIMARY KEY,
	name       text        NOT NULL,
	email      text        NOT NULL,
	message    text        NOT NULL,
	-- 'new' until an administrator marks it dealt with.
	status     text        NOT NULL DEFAULT 'new',
	handled_at timestamptz,
	-- The Privy DID of whoever marked it, from their verified session.
	handled_by text,
	-- Whether the notification email actually went out. False here with a row
	-- present means the message is safe but nobody was told about it.
	notified   boolean     NOT NULL DEFAULT false,
	ip         inet,
	user_agent text,
	created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enquiries
	DROP CONSTRAINT IF EXISTS enquiries_status_check;

ALTER TABLE enquiries
	ADD CONSTRAINT enquiries_status_check
	CHECK (status IN ('new', 'handled'));

-- The queue: unanswered first, newest first.
CREATE INDEX IF NOT EXISTS enquiries_status_created_at_idx
	ON enquiries (status, created_at DESC);

-- Serves the per-address rate check on submission, which is the only reason
-- the address is indexed at all.
CREATE INDEX IF NOT EXISTS enquiries_ip_created_at_idx
	ON enquiries (ip, created_at DESC);
