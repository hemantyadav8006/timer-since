import "server-only";

import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import { TIMER_CATEGORIES, TIMER_MODES, TIMER_SOUNDS } from "@/lib/ai/schema";

/**
 * Gemini-native JSON schema for structured timer drafts.
 * Kept flat (no Zod defaults) — Zod fills defaults after parse.
 */
export const TIMER_DRAFT_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "Short timer title",
    },
    description: {
      type: SchemaType.STRING,
      description: "Optional short description",
      nullable: true,
    },
    icon: {
      type: SchemaType.STRING,
      description: "Single emoji when possible",
      nullable: true,
    },
    color: {
      type: SchemaType.STRING,
      description: "Hex accent color like #00FF88",
      nullable: true,
    },
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...TIMER_CATEGORIES],
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      nullable: true,
    },
    mode: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...TIMER_MODES],
    },
    startDate: {
      type: SchemaType.NUMBER,
      description: "Epoch milliseconds",
    },
    targetDate: {
      type: SchemaType.NUMBER,
      description: "Epoch ms for countdown; null for elapsed",
      nullable: true,
    },
    sound: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...TIMER_SOUNDS],
      nullable: true,
    },
    milestones: {
      type: SchemaType.ARRAY,
      nullable: true,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          durationMs: { type: SchemaType.NUMBER },
          icon: { type: SchemaType.STRING, nullable: true },
        },
        required: ["label", "durationMs"],
      },
    },
    assumptions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      nullable: true,
    },
    confidence: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["high", "medium", "low"],
      nullable: true,
    },
  },
  required: ["title", "category", "mode", "startDate", "targetDate"],
};
