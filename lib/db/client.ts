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

	const pool = new Pool({
		connectionString,
		ssl: sslConfig(),
		// A droplet Postgres defaults to 100 connections shared across everything.
		// Keep the app's slice modest; raise alongside max_connections.
		max: Number(process.env.DATABASE_POOL_MAX ?? 10),
		/*
		 * Opening a connection to a managed database on another continent costs
		 * three to five seconds — TCP, TLS and authentication, before a single
		 * row moves. The query itself, for the largest read this app makes, is
		 * about three hundred milliseconds on a connection that is already open.
		 *
		 * So the connection is worth keeping. At the old thirty seconds, any
		 * navigation after a short pause paid the full handshake again, which is
		 * most navigations a person actually makes. Five minutes covers a working
		 * session; the retry below covers the connection dying inside it.
		 */
		idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_MS ?? 300_000),
		connectionTimeoutMillis: 10_000,
		// Stops a NAT or load balancer silently dropping a pooled connection
		// and handing it back later as a dead one. The initial delay matters:
		// left at the system default the first probe can come long after the
		// middlebox has already forgotten the connection.
		keepAlive: true,
		keepAliveInitialDelayMillis: 10_000,
	});

	/*
	 * A pooled connection can die while nobody is using it: a dropped link, a
	 * NAT timeout, the database recycling an idle session. There is no query to
	 * reject, so pg reports it as an 'error' event on the pool itself — and an
	 * 'error' event with no listener is an uncaught exception in Node, which
	 * ends the process.
	 *
	 * That failure is invisible from the browser, which is what makes it worth
	 * this comment. Anything mid-render simply stops: the response never
	 * completes, no error ever arrives, and the page sits on its loading
	 * skeleton indefinitely. One blip on a flaky connection, and the whole
	 * server is gone while the tab still looks like it is working.
	 *
	 * pg has already discarded the failed connection by the time this runs, so
	 * there is nothing to repair here — only something to say out loud.
	 */
	pool.on("error", (error: Error) => {
		console.error(`[db] pooled connection lost while idle: ${error.message}`);
	});

	return pool;
}

export function getPool(): Pool {
	if (!globalForDb.pool) {
		globalForDb.pool = createPool();
	}

	return globalForDb.pool;
}

/*
 * Connection failures arrive as a bare "Connection terminated due to
 * connection timeout" pointing at whichever line happened to run the query,
 * which says nothing about the cause. Reaching Postgres at all is a different
 * problem from a query being wrong, and it deserves to read like one.
 *
 * The host is named; the URL never is, because it carries the password.
 */
const CONNECTION_FAILURES = [
	"Connection terminated due to connection timeout",
	"timeout expired",
	"Connection terminated unexpectedly",
	"ECONNREFUSED",
	"ETIMEDOUT",
	"ENOTFOUND",
	"EHOSTUNREACH",
	"ENETUNREACH",
];

function describeFailure(error: unknown) {
	if (!(error instanceof Error)) return error;

	const failed = CONNECTION_FAILURES.some(
		(needle) =>
			error.message.includes(needle) ||
			(error as NodeJS.ErrnoException).code === needle,
	);

	if (!failed) return error;

	let where = "the configured host";

	try {
		const url = new URL(connectionString ?? "");
		where = `${url.hostname}:${url.port || "5432"}`;
	} catch {
		// Leave the generic description; a malformed URL is its own problem.
	}

	return new Error(
		`Cannot reach Postgres at ${where} — ${error.message}.\n` +
			"The database may be asleep or unreachable. If plain HTTPS to that host " +
			"works but this does not, the Postgres port is being blocked on this " +
			"network rather than by the database: try another network, or point " +
			"DATABASE_URL at a local Postgres for development.",
		{ cause: error },
	);
}

/*
 * A pooled connection can be dead before it is handed out. Nothing announces
 * it: a home router drops an idle NAT entry, a database recycles a session, and
 * the socket stays open-looking at this end until something is written to it.
 * Measured on a domestic connection, a pooled connection here dies somewhere
 * between forty-five and ninety seconds of silence.
 *
 * The first query after that does not wait — it fails immediately, with a
 * network error naming nothing a person could act on. Retrying once costs a
 * reconnect and turns it into an ordinary slow page.
 */
const STALE_CONNECTION = [
	"Connection terminated unexpectedly",
	"Client has encountered a connection error and is not queryable",
	"server closed the connection unexpectedly",
	"read ECONNRESET",
	"ECONNRESET",
	"EPIPE",
	"EADDRNOTAVAIL",
];

function isStaleConnection(error: unknown) {
	if (!(error instanceof Error)) return false;

	const code = (error as NodeJS.ErrnoException).code;

	return STALE_CONNECTION.some(
		(needle) => error.message.includes(needle) || code === needle,
	);
}

/*
 * Only reads. A write that failed on a dead socket may still have reached the
 * database — the acknowledgement is what went missing, not necessarily the
 * statement — and running it a second time would be this product deciding, on
 * its own, to record something twice. A failed write is reported instead.
 */
function isReadOnly(text: string) {
	const statement = text.trimStart().toUpperCase();

	return statement.startsWith("SELECT") && !statement.includes(" INTO ");
}

/** Run a parameterised query. Never interpolate values into the SQL string. */
export async function query<T extends Record<string, unknown>>(
	text: string,
	params?: unknown[],
) {
	try {
		const result = await getPool().query<T>(text, params);
		return result.rows;
	} catch (error) {
		if (isStaleConnection(error)) {
			if (isReadOnly(text)) {
				// The pool has already discarded the failed connection; this opens
				// a fresh one.
				try {
					const result = await getPool().query<T>(text, params);
					return result.rows;
				} catch (retried) {
					throw describeFailure(retried);
				}
			}

			// A write, which is deliberately left alone. Say that, rather than
			// leaving a bare socket error to be read as data loss.
			throw new Error(
				`The connection to Postgres died while running this statement — ${
					(error as Error).message
				}.\nIt writes, so it was not repeated automatically: a statement that ` +
					"failed after the database accepted it would be recorded twice. " +
					"Check whether it took effect, then run it again.",
				{ cause: error },
			);
		}

		throw describeFailure(error);
	}
}

/** Run several statements in one transaction, rolling back on any error. */
export async function transaction<T>(
	fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
	let client;

	try {
		client = await getPool().connect();
	} catch (error) {
		throw describeFailure(error);
	}

	try {
		await client.query("BEGIN");
		const result = await fn(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		// Best effort: if the connection is what failed, the rollback fails too,
		// and the original error is the one worth surfacing.
		await client.query("ROLLBACK").catch(() => {});
		throw describeFailure(error);
	} finally {
		client.release();
	}
}
