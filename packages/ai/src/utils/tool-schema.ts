import { z } from "zod";

export type ToolJsonSchema = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyRecord(value: unknown): value is Record<string, never> {
	return isRecord(value) && Object.keys(value).length === 0;
}

function normalizeProviderJsonSchema(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeProviderJsonSchema(item));
	}
	if (!isRecord(value)) {
		return value;
	}

	const normalized: Record<string, unknown> = {};
	for (const [key, child] of Object.entries(value)) {
		if (key === "additionalProperties" && isEmptyRecord(child)) {
			continue;
		}
		normalized[key] = normalizeProviderJsonSchema(child);
	}
	return normalized;
}

export function toolParametersToJsonSchema(parameters: z.ZodType): ToolJsonSchema {
	const schema = z.toJSONSchema(parameters, {
		// Use JSON Schema Draft 2020-12 for provider-facing tool schemas.
		// Zod-only constraints such as refine/superRefine are not representable
		// in JSON Schema and are enforced later by validating against the
		// original Zod schema before tool execution.
		target: "draft-2020-12",
		io: "input",
	});
	return normalizeProviderJsonSchema(schema) as ToolJsonSchema;
}
