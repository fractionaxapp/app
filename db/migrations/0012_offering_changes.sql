-- What changed about an offering, and when.
--
-- The crawler overwrites: each run replaces an offering's fields with whatever
-- the venue says now, which is right for the index and useless for watching a
-- position. Monitoring needs the before as well as the after.
--
-- Recorded by a trigger rather than by the crawler, because the crawler writes
-- in batches of two hundred rows and a batch cannot see the row it replaced.
-- A trigger also covers every other way a row could change — a fix by hand, a
-- future importer — which is the point of putting it in the database.

CREATE TABLE IF NOT EXISTS offering_changes (
	id          bigserial   PRIMARY KEY,
	offering_id uuid        NOT NULL REFERENCES offerings (id) ON DELETE CASCADE,
	field       text        NOT NULL,
	before      text,
	after       text,
	changed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offering_changes_offering_idx
	ON offering_changes (offering_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS offering_changes_at_idx
	ON offering_changes (changed_at DESC);

/*
 * last_seen moves on every crawl and raw moves with it, so neither is watched:
 * logging them would write a row per offering per run and bury the changes
 * that matter under them.
 *
 * aum and holders_count drift constantly by nature. They are watched, but only
 * a material move is recorded — a fund whose assets fall by half is worth
 * knowing about, and one that moves 0.3% overnight is not.
 */
CREATE OR REPLACE FUNCTION record_offering_change() RETURNS trigger AS $$
DECLARE
	moved numeric;
BEGIN
	IF NEW.net_yield IS DISTINCT FROM OLD.net_yield THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'net_yield', OLD.net_yield::text, NEW.net_yield::text);
	END IF;

	IF NEW.term_months IS DISTINCT FROM OLD.term_months THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'term_months', OLD.term_months::text, NEW.term_months::text);
	END IF;

	IF NEW.seniority IS DISTINCT FROM OLD.seniority THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'seniority', OLD.seniority, NEW.seniority);
	END IF;

	IF NEW.dscr IS DISTINCT FROM OLD.dscr THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'dscr', OLD.dscr::text, NEW.dscr::text);
	END IF;

	IF NEW.minimum IS DISTINCT FROM OLD.minimum THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'minimum', OLD.minimum::text, NEW.minimum::text);
	END IF;

	IF NEW.currency IS DISTINCT FROM OLD.currency THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'currency', OLD.currency, NEW.currency);
	END IF;

	IF NEW.jurisdiction IS DISTINCT FROM OLD.jurisdiction THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'jurisdiction', OLD.jurisdiction, NEW.jurisdiction);
	END IF;

	IF NEW.asset_class IS DISTINCT FROM OLD.asset_class THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'asset_class', OLD.asset_class, NEW.asset_class);
	END IF;

	IF NEW.fund_structure IS DISTINCT FROM OLD.fund_structure THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'fund_structure', OLD.fund_structure, NEW.fund_structure);
	END IF;

	IF NEW.redemption_frequency IS DISTINCT FROM OLD.redemption_frequency THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'redemption_frequency', OLD.redemption_frequency, NEW.redemption_frequency);
	END IF;

	IF NEW.investor_types IS DISTINCT FROM OLD.investor_types THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'investor_types',
			array_to_string(OLD.investor_types, ', '),
			array_to_string(NEW.investor_types, ', '));
	END IF;

	IF NEW.management_fee IS DISTINCT FROM OLD.management_fee THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'management_fee', OLD.management_fee::text, NEW.management_fee::text);
	END IF;

	IF NEW.performance_fee IS DISTINCT FROM OLD.performance_fee THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'performance_fee', OLD.performance_fee::text, NEW.performance_fee::text);
	END IF;

	IF NEW.url IS DISTINCT FROM OLD.url THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'url', OLD.url, NEW.url);
	END IF;

	IF NEW.title IS DISTINCT FROM OLD.title THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'title', OLD.title, NEW.title);
	END IF;

	IF NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at THEN
		INSERT INTO offering_changes (offering_id, field, before, after)
		VALUES (NEW.id, 'withdrawn_at', OLD.withdrawn_at::text, NEW.withdrawn_at::text);
	END IF;

	-- Material moves only, for the two that never sit still.
	IF NEW.aum IS DISTINCT FROM OLD.aum THEN
		moved := CASE
			WHEN OLD.aum IS NULL OR OLD.aum = 0 THEN 1
			ELSE abs(coalesce(NEW.aum, 0) - OLD.aum) / OLD.aum
		END;

		IF moved >= 0.05 THEN
			INSERT INTO offering_changes (offering_id, field, before, after)
			VALUES (NEW.id, 'aum', OLD.aum::text, NEW.aum::text);
		END IF;
	END IF;

	IF NEW.holders_count IS DISTINCT FROM OLD.holders_count THEN
		moved := CASE
			WHEN OLD.holders_count IS NULL OR OLD.holders_count = 0 THEN 1
			ELSE abs(coalesce(NEW.holders_count, 0) - OLD.holders_count)::numeric
				/ OLD.holders_count
		END;

		IF moved >= 0.05 THEN
			INSERT INTO offering_changes (offering_id, field, before, after)
			VALUES (NEW.id, 'holders_count', OLD.holders_count::text, NEW.holders_count::text);
		END IF;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS offerings_record_change ON offerings;

CREATE TRIGGER offerings_record_change
	AFTER UPDATE ON offerings
	FOR EACH ROW
	EXECUTE FUNCTION record_offering_change();
