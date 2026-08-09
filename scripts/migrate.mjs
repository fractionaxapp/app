/*
 * Minimal forward-only migration runner.
 *
 * Applies every .sql file in db/migrations in filename order that has not been
 * applied yet, recording each in a _migrations table. Each file runs inside a
 * transaction, so a failing migration leaves no partial state.
 *
 * Run with: npm run db:migrate
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import pg from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error(
		"DATABASE_URL is not set.\n" +
			"Copy .env.example to .env.local and point DATABASE_URL at your Postgres instance.",
	);
	process.exit(1);
}

const client = new pg.Client({
	connectionString,
	ssl:
		process.env.DATABASE_SSL === "true"
			? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" }
			: undefined,
});

await client.connect();

try {
	await client.query(`
		CREATE TABLE IF NOT EXISTS _migrations (
			name        text        PRIMARY KEY,
			applied_at  timestamptz NOT NULL DEFAULT now()
		)
	`);

	const { rows } = await client.query("SELECT name FROM _migrations");
	const applied = new Set(rows.map((row) => row.name));

	const files = (await readdir(MIGRATIONS_DIR))
		.filter((file) => file.endsWith(".sql"))
		.sort();

	const pending = files.filter((file) => !applied.has(file));

	if (pending.length === 0) {
		console.log(`Up to date — ${files.length} migration(s) already applied.`);
		process.exit(0);
	}

	for (const file of pending) {
		const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");

		try {
			await client.query("BEGIN");
			await client.query(sql);
			await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
			await client.query("COMMIT");
			console.log(`Applied ${file}`);
		} catch (error) {
			await client.query("ROLLBACK");
			console.error(`Failed on ${file} — rolled back.`);
			throw error;
		}
	}

	console.log(`Done — applied ${pending.length} migration(s).`);
} finally {
	await client.end();
}
