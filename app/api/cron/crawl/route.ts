import { NextResponse, type NextRequest } from "next/server";

import { crawlAll } from "@/lib/sourcing/crawl";

/*
 * The scheduled crawl.
 *
 * A route rather than a script so the cron job and the admin button run the
 * same code against the same environment — a crawler that behaves differently
 * depending on how it was started is one you cannot debug from its output.
 *
 * Authorisation is a shared secret, compared in full every time. With no
 * CRON_SECRET set the endpoint refuses outright rather than running openly:
 * an unauthenticated crawl trigger is a way to make this server hammer someone
 * else's on request.
 */

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	const secret = process.env.CRON_SECRET;

	if (!secret) {
		return NextResponse.json(
			{ error: "CRON_SECRET is not set" },
			{ status: 503 },
		);
	}

	const offered = request.headers.get("authorization");

	if (offered !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
	}

	const results = await crawlAll();

	return NextResponse.json({
		ran: results.length,
		results,
	});
}
