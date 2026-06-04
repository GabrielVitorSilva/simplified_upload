import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

export function generateApiKey(): string {
  return `fsk_${uuidv4().replace(/-/g, "")}`;
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}
