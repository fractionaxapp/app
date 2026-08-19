import "server-only";

/*
 * The model, over the Messages API.
 *
 * Called with fetch for the same reason Resend is: this project asks the model
 * for one thing — a structured object matching a schema — and a dependency
 * that has to be kept current for that is a dependency that will one day break
 * a build for nothing.
 *
 * Output is forced through a tool definition rather than asked for as JSON in
 * prose. Text that merely looks like JSON has to be salvaged with fence
 * stripping and hope; a forced tool call arrives as an object or does not
 * arrive at all, and "did not arrive" is a case this code can handle honestly.
 */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

/*
 * Sonnet by default: every call here is a bounded extraction from text the
 * caller already has, run once per offering, and that is work Sonnet does
 * accurately at a fraction of the cost of a frontier model. Set
 * ANTHROPIC_MODEL to override.
 */
const DEFAULT_MODEL = "claude-sonnet-5";

export function isAiConfigured() {
	return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function aiModel() {
	return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
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

/**
 * Ask for one structured object. Returns null when the model is not
 * configured, refuses, or answers with anything other than the tool call —
 * never throws, because every caller has a way to carry on without it.
 */
export async function extract<T>(options: ExtractOptions): Promise<T | null> {
	const key = process.env.ANTHROPIC_API_KEY;
	if (!key) return null;

	try {
		const response = await fetch(ENDPOINT, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-api-key": key,
				"anthropic-version": VERSION,
			},
			body: JSON.stringify({
				model: aiModel(),
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
				"Anthropic API rejected the request",
				response.status,
				await response.text().catch(() => ""),
			);
			return null;
		}

		const payload = (await response.json()) as {
			content?: { type: string; name?: string; input?: unknown }[];
		};

		const call = payload.content?.find(
			(block) => block.type === "tool_use" && block.name === options.name,
		);

		return (call?.input as T) ?? null;
	} catch (error) {
		console.error("Failed to reach the model", error);
		return null;
	}
}
