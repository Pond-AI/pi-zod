import { z } from "zod";

/**
 * Creates a string enum schema compatible with Google's API and other providers
 * that don't support anyOf/const patterns.
 *
 * @example
 * const OperationSchema = StringEnum(["add", "subtract", "multiply", "divide"], {
 *   description: "The operation to perform"
 * });
 *
 * type Operation = z.output<typeof OperationSchema>; // "add" | "subtract" | "multiply" | "divide"
 */
export function StringEnum<const T extends readonly [string, ...string[]]>(
	values: T,
	options?: { description?: string; default?: T[number] },
) {
	const metadata: { description?: string; default?: T[number] } = {};
	if (options?.description) {
		metadata.description = options.description;
	}
	if (options?.default !== undefined) {
		metadata.default = options.default;
	}
	const schema = z.enum(values);
	return Object.keys(metadata).length > 0 ? schema.meta(metadata) : schema;
}
