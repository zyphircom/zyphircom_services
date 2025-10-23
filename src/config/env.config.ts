import { envSchema } from "./validation";
import { ZodError } from "zod";

export default () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const error = parsed.error as ZodError;

    const errorMessages: string[] = [
      "",
      "Environment Variable Validation Failed",
      "".padEnd(50, "─"),
      "",
      "The following environment variables have issues:",
      "",
    ];
    const errorsByField = new Map<string, string[]>();

    error.issues.forEach((issue) => {
      const field = issue.path.join(".") || "Unknown field";
      if (!errorsByField.has(field)) {
        errorsByField.set(field, []);
      }
      errorsByField.get(field)!.push(issue.message);
    });

    errorsByField.forEach((messages, field) => {
      errorMessages.push(`  🔸 ${field}:`);
      messages.forEach((message) => {
        errorMessages.push(`     → ${message}`);
      });
      errorMessages.push("");
    });

    errorMessages.push("".padEnd(50, "─"));
    errorMessages.push("");

    errorMessages.push("Please check your .env file.");
    errorMessages.push("");

    const formattedError = errorMessages.join("\n");

    throw new Error(formattedError);
  }

  return parsed.data;
};
