import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getModel } from "../src/models.js";
import { complete } from "../src/stream.js";
import type { Context, Model } from "../src/types.js";

interface MistralToolPayload {
	tools?: Array<{
		type: "function";
		function: {
			name: string;
			parameters: Record<string, unknown>;
		};
	}>;
}

describe("Mistral tool schema serialization", () => {
	it("serializes Zod tool schemas before the SDK validates tool schemas", async () => {
		const model: Model<"mistral-conversations"> = {
			...getModel("mistral", "devstral-medium-latest"),
			baseUrl: "http://127.0.0.1:9",
		};
		const parameters = z.looseObject({
			nested: z.looseObject({
				value: z.string(),
			}),
		});
		const context: Context = {
			messages: [{ role: "user", content: "Hi", timestamp: Date.now() }],
			tools: [
				{
					name: "inspect_schema",
					description: "Inspect the schema",
					parameters,
				},
			],
		};
		let capturedPayload: MistralToolPayload | undefined;

		const response = await complete(model, context, {
			apiKey: "fake-key",
			onPayload: (payload) => {
				capturedPayload = payload as MistralToolPayload;
				return payload;
			},
		});

		expect(capturedPayload?.tools).toHaveLength(1);
		const payloadParameters = capturedPayload?.tools?.[0]?.function.parameters;
		expect(payloadParameters).toBeDefined();
		expect(Object.getOwnPropertySymbols(payloadParameters ?? {})).toHaveLength(0);
		const properties = payloadParameters?.properties;
		expect(properties).toBeTruthy();
		expect(Object.getOwnPropertySymbols((properties as Record<string, unknown>) ?? {})).toHaveLength(0);
		const nested = (properties as Record<string, unknown> | undefined)?.nested;
		expect(nested).toBeTruthy();
		expect(Object.getOwnPropertySymbols((nested as Record<string, unknown>) ?? {})).toHaveLength(0);
		expect(response.stopReason).toBe("error");
		expect(response.errorMessage).not.toContain("Input validation failed");
	});
});
