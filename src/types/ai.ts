/** Client-safe AI types (no server imports / secrets). */

export type GeminiModelInfo = {
  id: string;
  displayName: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
};
