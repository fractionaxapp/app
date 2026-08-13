/*
 * PM2 process definition for the Next.js server.
 *
 * PM2 supervises this app only. Postgres is managed by systemd — see
 * db/README.md. Do not add the database here: two supervisors fighting over
 * one process is worse than either alone.
 *
 *   pm2 start ecosystem.config.cjs
 *   pm2 startup && pm2 save     # survive reboot
 */

module.exports = {
	apps: [
		{
			name: "app",

			/*
			 * Invoke Next's binary directly rather than `npm start`. Going
			 * through npm inserts a shim process between PM2 and the server, and
			 * signals do not reliably reach the child through it — so a restart
			 * or reload can leave the real server running or kill it abruptly.
			 */
			script: "node_modules/next/dist/bin/next",
			args: "start",
			// PM2 resolves `script` relative to `cwd`.
			cwd: __dirname,

			/*
			 * One process. Next handles concurrency internally, and multiple
			 * instances on one droplet share .next/cache, which can produce
			 * inconsistent ISR results. To scale, put a reverse proxy in front of
			 * several droplets rather than switching this to cluster mode.
			 */
			exec_mode: "fork",
			instances: 1,

			autorestart: true,
			watch: false,
			max_memory_restart: "512M",

			/*
			 * PM2 defaults to ~1600 ms between SIGINT and SIGKILL, which is not
			 * enough for in-flight requests to drain. Give the server ten seconds
			 * to finish and close connections before it is killed.
			 */
			kill_timeout: 10_000,

			/*
			 * Runtime configuration only. Secrets belong in .env.local on the
			 * droplet, which Next loads itself — never commit them here.
			 *
			 * Note that NEXT_PUBLIC_* variables are inlined at BUILD time, so
			 * setting them here has no effect. See DEPLOY.md.
			 */
			env: {
				NODE_ENV: "production",
				PORT: 3000,
			},
		},
	],
};
