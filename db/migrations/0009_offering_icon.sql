-- The offering's own icon.
--
-- Promoted to a column because the list queries deliberately do not select
-- raw — there is no sense shipping thirteen hundred full payloads to draw a
-- table — and a row without its mark is much harder to pick out of a list.

ALTER TABLE offerings
	ADD COLUMN IF NOT EXISTS icon_url text;
