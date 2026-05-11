import { describe, expect, it } from "vitest";
import { z } from "zod";
import { convertTools } from "../src/providers/google-shared.js";
import type { Tool } from "../src/types.js";

function makeTool(parameters: Tool["parameters"]): Tool {
	return {
		name: "test_tool",
		description: "A test tool",
		parameters,
	};
}

const parameters = z.looseObject({
	command: z.string(),
});

describe("google-shared convertTools", () => {
	it("strips JSON Schema meta keys from generated parameters when useParameters=true", () => {
		const result = convertTools([makeTool(parameters)], true);
		const decl = result?.[0]?.functionDeclarations?.[0];

		expect(decl).toBeDefined();
		expect(decl?.parameters).toEqual({
			type: "object",
			properties: {
				command: { type: "string" },
			},
			required: ["command"],
		});
		expect(decl?.parameters).not.toHaveProperty("$schema");
	});

	it("preserves $schema in parametersJsonSchema when useParameters=false", () => {
		const result = convertTools([makeTool(parameters)], false);
		const decl = result?.[0]?.functionDeclarations?.[0];

		expect(decl).toBeDefined();
		expect(decl?.parametersJsonSchema).toEqual({
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "object",
			properties: {
				command: { type: "string" },
			},
			required: ["command"],
		});
	});

	it("returns undefined for empty tool list", () => {
		expect(convertTools([])).toBeUndefined();
		expect(convertTools([], true)).toBeUndefined();
	});
});
