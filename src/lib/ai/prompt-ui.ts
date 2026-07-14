/** Timer-domain rotating placeholders for the AI prompt box. */
export const AI_PROMPT_SUGGESTIONS = [
  "Track 90 days sober since March 1…",
  "Countdown to my exam on August 15…",
  "Baby born June 10 with milestones…",
  "Quit smoking — started yesterday…",
  "Wedding anniversary countdown — Dec 20…",
  "Meditation streak from last Monday, nature sound…",
  "Sugar detox starting today with weekly milestones…",
  "Track time since my last workout…",
  "Create a habit timer for reading every day…",
  "Countdown to launch day next month…",
] as const;

/** Shown while a draft is being generated. */
export const AI_PROCESSING_MESSAGES = [
  "Thinking…",
  "Understanding your request…",
  "Analyzing context…",
  "Crafting milestones…",
  "Generating draft…",
  "Almost done…",
] as const;

export const AI_SUGGESTION_ROTATE_MS = 2600;
export const AI_PROCESSING_ROTATE_MS = 1300;
