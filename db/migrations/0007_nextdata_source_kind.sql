-- Allow a source that reads a Next.js page's own data payload.
--
-- The deploy hash in those URLs is discovered per crawl rather than stored,
-- so the kind carries no configuration beyond the page URL and the usual
-- field mapping.

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_kind_check;

ALTER TABLE sources ADD CONSTRAINT sources_kind_check
	CHECK (kind IN ('json', 'rss', 'rwa', 'nextdata'));
