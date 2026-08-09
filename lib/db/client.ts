import "server-only";

import { Pool } from "pg";

/*
 * Postgres connection pool for the self-hosted database on the DigitalOcean
 * droplet.
 *
 * The "server-only" import above makes importing this module from a Client
 * Component a build error rather than a runtime leak of credentials.
 */

const connectionString = process.env.DATABASE_URL;

export const isDatabaseEnabled = Boolean(connectionString);

/*
 * A stock Postgres install on a droplet has no TLS certificate, while managed
 * offerings require one. Default to off and let the environment opt in, since
 * this project targets the droplet.
 */
function sslConfig() {
	if (process.env.DATABASE_SSL !== "true") return undefined;

	// Droplet certificates are usually self-signed; set DATABASE_SSL_STRICT to
	// enforce a verifiable chain once you install a real certificate.
	return { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" };
}

/*
 * Next's dev server re-evaluates modules on hot reload. Without stashing the
 * pool on globalThis, every edit would leak another pool and exhaust Postgres
 * connection slots.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
	if (!connectionString) {
		throw new Error(
			"DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance.",
		);
	}

	return new Pool({
		connectionString,
		ssl: sslConfig(),
		// A droplet Postgres defaults to 100 connections shared across everything.
		// Keep the app's slice modest; raise alongside max_connections.
		max: Number(process.env.DATABASE_POOL_MAX ?? 10),
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 10_000,
	});
}

export function getPool(): Pool {
	if (!globalForDb.pool) {
		globalForDb.pool = createPool();
	}

	return globalForDb.pool;
}

/** Run a parameterised query. Never interpolate values into the SQL string. */
export async function query<T extends Record<string, unknown>>(
	text: string,
	params?: unknown[],
) {
	const result = await getPool().query<T>(text, params);
	return result.rows;
}

/** Run several statements in one transaction, rolling back on any error. */
export async function transaction<T>(
	fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
	const client = await getPool().connect();

	try {
		await client.query("BEGIN");
		const result = await fn(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}
