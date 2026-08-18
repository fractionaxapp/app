-- Who changed whose access, and when.
--
-- The users table records the current state and nothing about how it got
-- there. Once access is granted from a screen rather than from psql, that is
-- not enough: admitting someone to a product that moves money is a decision
-- worth being able to attribute afterwards.
--
-- The actor is stored as the Privy DID from the verified session, not a name
-- or an email, because that is the only identifier the session can prove. The
-- email is copied alongside it purely so the log is readable months later.

CREATE TABLE IF NOT EXISTS access_changes (
	id           bigserial   PRIMARY KEY,
	user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	from_status  text        NOT NULL,
	to_status    text        NOT NULL,
	actor_did    text        NOT NULL,
	actor_email  text,
	changed_at   timestamptz NOT NULL DEFAULT now()
);

-- The two questions asked of this table: what happened to this account, and
-- what happened recently across all of them.
CREATE INDEX IF NOT EXISTS access_changes_user_id_changed_at_idx
	ON access_changes (user_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS access_changes_changed_at_idx
	ON access_changes (changed_at DESC);
