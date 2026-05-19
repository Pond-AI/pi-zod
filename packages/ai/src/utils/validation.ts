import { z } from "zod";
import type { Tool, ToolCall } from "../types.js";

/**
 * Finds a tool by name and validates the tool call arguments against its Zod schema.
 * @param tools Array of tool definitions
 * @param toolCall The tool call from the LLM
 * @returns The validated arguments
 * @throws Error if tool is not found or validation fails
 */
export function validateToolCall(tools: Tool[], toolCall: ToolCall): unknown {
	const tool = tools.find((t) => t.name === toolCall.name);
	if (!tool) {
		throw new Error(`Tool "${toolCall.name}" not found`);
	}
	return validateToolArguments(tool, toolCall);
}

/**
 * Validates tool call arguments against the tool's Zod schema.
 * Zod refinements are enforced here even when they cannot be represented in the
 * JSON Schema sent to providers.
 * @param tool The tool definition with a Zod parameter schema
 * @param toolCall The tool call from the LLM
 * @returns The validated arguments
 * @throws Error with formatted message if validation fails
 */
export function validateToolArguments<TParameters extends z.ZodType>(
	tool: Tool<TParameters>,
	toolCall: ToolCall,
): z.output<TParameters> {
	const result = tool.parameters.safeParse(toolCall.arguments, { jitless: true });
	if (result.success) {
		return result.data;
	}

	const errorMessage = `Validation failed for tool "${toolCall.name}":\n${z.prettifyError(result.error)}\n\nReceived arguments:\n${JSON.stringify(toolCall.arguments, null, 2)}`;

	throw new Error(errorMessage);
}
