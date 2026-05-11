import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Tool, ToolCall } from "../src/types.js";
import { validateToolArguments } from "../src/utils/validation.js";

function createTool(parameters: Tool["parameters"]): Tool {
	return {
		name: "echo",
		description: "Echo tool",
		parameters,
	};
}

function createToolCall(argumentsValue: Record<string, unknown>): ToolCall {
	return {
		type: "toolCall",
		id: "tool-1",
		name: "echo",
		arguments: argumentsValue,
	};
}

describe("validateToolArguments", () => {
	it("validates when Function constructor is unavailable", () => {
		const originalFunction = globalThis.Function;
		const tool = createTool(
			z.looseObject({
				count: z.coerce.number(),
			}),
		);
		const toolCall = createToolCall({ count: "42" });

		globalThis.Function = (() => {
			throw new EvalError("Code generation from strings disallowed for this context");
		}) as unknown as FunctionConstructor;

		try {
			expect(validateToolArguments(tool, toolCall)).toEqual({ count: 42 });
		} finally {
			globalThis.Function = originalFunction;
		}
	});

	it("enforces Zod refinements", () => {
		const tool = createTool(
			z.looseObject({
				path: z.string().refine((value) => !value.includes(".."), {
					message: "path must not contain '..'",
				}),
			}),
		);

		expect(validateToolArguments(tool, createToolCall({ path: "src/index.ts" }))).toEqual({
			path: "src/index.ts",
		});
		expect(() => validateToolArguments(tool, createToolCall({ path: "../secret" }))).toThrow(
			"path must not contain '..'",
		);
	});

	it("formats Zod validation errors for model retry", () => {
		const tool = createTool(
			z.looseObject({
				count: z.number().min(1),
			}),
		);

		expect(() => validateToolArguments(tool, createToolCall({ count: 0 }))).toThrow(
			/Validation failed for tool "echo":[\s\S]*count[\s\S]*Received arguments/,
		);
	});
});
