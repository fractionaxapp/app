import "server-only";

/*
 * The model, over the Messages API, with a fallback.
 *
 * Called with fetch for the same reason Resend is: this project asks for one
 * thing — a structured object matching a schema — and a dependency that has to
 * be kept current for that is a dependency that will one day break a build for
 * nothing. Keeping it to fetch is also what makes the fallback cheap: MiniMax
 * publishes an Anthropic-compatible endpoint, so the same request body goes to
 * either provider with only the URL, the key and the model changing.
 *
 * Output is forced through a tool definition rather than asked for as JSON in
 * prose. Text that merely looks like JSON has to be salvaged with fence
 * stripping and hope; a forced tool call arrives as an object or does not
 * arrive at all, and "did not arrive" is a case this code can handle honestly.
 */

const VERSION = "2023-06-01";

export type ProviderName = "claude" | "minimax";

type Provider = {
	name: ProviderName;
	endpoint: string;
	key: string;
	model: string;
};

/*
 * Sonnet by default: every call here is a bounded extraction from text the
 * caller already has, run once per offering, and that is work Sonnet does
 * accurately at a fraction of the cost of a frontier model.
 */
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5";

/* MiniMax's own quickstart model for the Anthropic-compatible endpoint. */
const DEFAULT_MINIMAX_MODEL = "MiniMax-M3";
const DEFAULT_MINIMAX_BASE = "https://api.minimax.io/anthropic";

/**
 * Providers to try, in order. Anthropic first when both are configured — the
 * fallback exists for when it is missing or unreachable, not as a coin toss,
 * and a parse that silently changed model between runs would be very hard to
 * account for later.
 */
export function providers(): Provider[] {
	const list: Provider[] = [];

	if (process.env.ANTHROPIC_API_KEY) {
		list.push({
			name: "claude",
			endpoint: "https://api.anthropic.com/v1/messages",
			key: process.env.ANTHROPIC_API_KEY,
			model: process.env.ANTHROPIC_MODEL || DEFAULT_CLAUDE_MODEL,
		});
	}

	if (process.env.MINIMAX_API_KEY) {
		const base = (process.env.MINIMAX_BASE_URL || DEFAULT_MINIMAX_BASE).replace(
			/\/+$/,
			"",
		);

		list.push({
			name: "minimax",
			endpoint: `${base}/v1/messages`,
			key: process.env.MINIMAX_API_KEY,
			model: process.env.MINIMAX_MODEL || DEFAULT_MINIMAX_MODEL,
		});
	}

	return list;
}

export function isAiConfigured() {
	return providers().length > 0;
}

/** Human-readable account of what will be tried, for the admin screen. */
export function aiDescription() {
	const configured = providers();
	if (configured.length === 0) return null;

	const [first, ...rest] = configured;

	return rest.length === 0
		? first.model
		: `${first.model}, falling back to ${rest.map((p) => p.model).join(", then ")}`;
}

type ExtractOptions = {
	/** Names the tool, so the model knows what it is filling in. */
	name: string;
	description: string;
	/** JSON Schema for the object wanted back. */
	schema: Record<string, unknown>;
	system: string;
	prompt: string;
	maxTokens?: number;
};

export type Extraction<T> = { value: T; provider: ProviderName };

/**
 * Ask one provider. Returns null on anything other than a usable tool call, so
 * the caller can move to the next — never throws, because every caller has a
 * way to carry on without a model at all.
 */
async function ask<T>(
	provider: Provider,
	options: ExtractOptions,
): Promise<T | null> {
	try {
		const response = await fetch(provider.endpoint, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-api-key": provider.key,
				"anthropic-version": VERSION,
			},
			body: JSON.stringify({
				model: provider.model,
				max_tokens: options.maxTokens ?? 1024,
				system: options.system,
				tools: [
					{
						name: options.name,
						description: options.description,
						input_schema: options.schema,
					},
				],
				tool_choice: { type: "tool", name: options.name },
				messages: [{ role: "user", content: options.prompt }],
			}),
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			console.error(
				`${provider.name} rejected the request`,
				response.status,
				await response.text().catch(() => ""),
			);
			return null;
		}

		const payload = (await response.json()) as {
			content?: { type: string; name?: string; input?: unknown }[];
			/*
			 * MiniMax's native API answers 200 with the failure in the body. The
			 * compatible endpoint should not, but a provider that has that habit
			 * anywhere is one worth checking for it here.
			 */
			base_resp?: { status_code?: number; status_msg?: string };
		};

		if (payload.base_resp && payload.base_resp.status_code !== 0) {
			console.error(
				`${provider.name} returned an error body`,
				payload.base_resp.status_msg ?? payload.base_resp.status_code,
			);
			return null;
		}

		const call = payload.content?.find(
			(block) => block.type === "tool_use" && block.name === options.name,
		);

		if (!call) {
			console.error(`${provider.name} answered without the tool call`);
			return null;
		}

		return (call.input as T) ?? null;
	} catch (error) {
		console.error(`Failed to reach ${provider.name}`, error);
		return null;
	}
}

/**
 * Ask for one structured object, trying each configured provider in turn.
 *
 * The provider that answered comes back with the value. Callers record it, so
 * a surprising parse can be attributed to the model that produced it rather
 * than to whichever one happens to be configured when the question is asked.
 */
export async function extract<T>(
	options: ExtractOptions,
): Promise<Extraction<T> | null> {
	for (const provider of providers()) {
		const value = await ask<T>(provider, options);
		if (value !== null) return { value, provider: provider.name };
	}

	return null;
}
