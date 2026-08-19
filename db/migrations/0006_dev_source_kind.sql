-- Allow the development-only rwa.xyz reader as a source kind.
--
-- Enabling it is an environment decision (ENABLE_DEV_SOURCES), not a schema
-- one; the constraint only has to stop a typo becoming a row that no adapter
-- can read.

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_kind_check;

ALTER TABLE sources ADD CONSTRAINT sources_kind_check
	CHECK (kind IN ('json', 'rss', 'rwa'));
