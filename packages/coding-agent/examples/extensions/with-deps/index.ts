/**
 * Example extension with its own npm dependencies.
 * Tests that jiti resolves modules from the extension's own node_modules.
 *
 * Requires: npm install in this directory
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import ms from "ms";
import { z } from "zod";

export default function (pi: ExtensionAPI) {
	// Register a tool that uses ms
	pi.registerTool({
		name: "parse_duration",
		label: "Parse Duration",
		description: "Parse a human-readable duration string (e.g., '2 days', '1h', '5m') to milliseconds",
		parameters: z.looseObject({
			duration: z.string().describe("Duration string like '2 days', '1h', '5m'"),
		}),
		execute: async (_toolCallId, params) => {
			const result = ms(params.duration as ms.StringValue);
			if (result === undefined) {
				throw new Error(`Invalid duration: "${params.duration}"`);
			}
			return {
				content: [{ type: "text", text: `${params.duration} = ${result} milliseconds` }],
				details: {},
			};
		},
	});
}
