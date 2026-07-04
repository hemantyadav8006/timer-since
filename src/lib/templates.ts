import type {
  TimerCategory,
  ThemeName,
  SoundName,
  MilestoneDefinition,
} from "@/types/timer";

export type TemplateConfig = {
  name: string;
  label: string;
  description: string;
  icon: string;
  defaultCategory: TimerCategory | string;
  defaultTheme: ThemeName | string;
  defaultMode: "count-up" | "count-down";
  defaultSound: SoundName;
  defaultName: string;
  milestones: MilestoneDefinition[];
};

const MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
  year: 31_536_000_000,
};

export const TEMPLATES: TemplateConfig[] = [
  {
    name: "sobriety",
    label: "Sobriety / Recovery",
    description: "Track your sober journey with recovery milestones",
    icon: "💪",
    defaultCategory: "health",
    defaultTheme: "emerald",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "My Sobriety Timer",
    milestones: [
      { label: "24 Hours", durationMs: MS.day, icon: "⭐" },
      { label: "1 Week", durationMs: MS.week, icon: "🌟" },
      { label: "30 Days", durationMs: 30 * MS.day, icon: "🏅" },
      { label: "90 Days", durationMs: 90 * MS.day, icon: "🏆" },
      { label: "6 Months", durationMs: 6 * MS.month, icon: "💎" },
      { label: "1 Year", durationMs: MS.year, icon: "👑" },
    ],
  },
  {
    name: "baby",
    label: "Baby / New Parent",
    description: "Track your baby's age with developmental milestones",
    icon: "👶",
    defaultCategory: "personal",
    defaultTheme: "rose",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "Baby's Age",
    milestones: [
      { label: "First Smile (~6 weeks)", durationMs: 42 * MS.day, icon: "😊" },
      { label: "First Laugh (~4 months)", durationMs: 120 * MS.day, icon: "😂" },
      { label: "First Tooth (~6 months)", durationMs: 180 * MS.day, icon: "🦷" },
      { label: "Crawling (~8 months)", durationMs: 240 * MS.day, icon: "🐛" },
      { label: "First Steps (~12 months)", durationMs: 365 * MS.day, icon: "👣" },
    ],
  },
  {
    name: "fitness",
    label: "Fitness / Workout",
    description: "Track time since last workout",
    icon: "🏋️",
    defaultCategory: "health",
    defaultTheme: "amber",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "Last Workout",
    milestones: [
      { label: "1 Day Streak", durationMs: MS.day, icon: "🔥" },
      { label: "1 Week Streak", durationMs: MS.week, icon: "💪" },
      { label: "30 Day Streak", durationMs: 30 * MS.day, icon: "🏅" },
      { label: "100 Day Streak", durationMs: 100 * MS.day, icon: "💯" },
    ],
  },
  {
    name: "student",
    label: "Student / Exam Prep",
    description: "Countdown to exams",
    icon: "📚",
    defaultCategory: "education",
    defaultTheme: "ocean",
    defaultMode: "count-down",
    defaultSound: "none",
    defaultName: "Exam Countdown",
    milestones: [
      { label: "1 Month Left", durationMs: MS.month, icon: "📅" },
      { label: "1 Week Left", durationMs: MS.week, icon: "⏰" },
      { label: "1 Day Left", durationMs: MS.day, icon: "🔔" },
    ],
  },
  {
    name: "couple",
    label: "Couple / Relationship",
    description: "Track your relationship with anniversary milestones",
    icon: "💕",
    defaultCategory: "relationship",
    defaultTheme: "rose",
    defaultMode: "count-up",
    defaultSound: "heartbeat",
    defaultName: "Together Since",
    milestones: [
      { label: "1 Month", durationMs: MS.month, icon: "💐" },
      { label: "6 Months", durationMs: 6 * MS.month, icon: "💝" },
      { label: "1 Year", durationMs: MS.year, icon: "🎉" },
      { label: "5 Years", durationMs: 5 * MS.year, icon: "🌹" },
    ],
  },
  {
    name: "freelancer",
    label: "Freelancer / Work",
    description: "Track work sessions and billable time",
    icon: "💼",
    defaultCategory: "work",
    defaultTheme: "amber",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "Work Session",
    milestones: [
      { label: "1 Hour", durationMs: MS.hour, icon: "⏱️" },
      { label: "4 Hours", durationMs: 4 * MS.hour, icon: "📊" },
      { label: "8 Hours", durationMs: 8 * MS.hour, icon: "✅" },
    ],
  },
  {
    name: "quit-smoking",
    label: "Quit Smoking",
    description: "Track smoke-free time with health milestones",
    icon: "🚭",
    defaultCategory: "health",
    defaultTheme: "emerald",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "Smoke-Free Since",
    milestones: [
      { label: "20 min: Heart rate normalizes", durationMs: 20 * MS.minute, icon: "❤️" },
      { label: "48 hours: Nerves regenerate", durationMs: 48 * MS.hour, icon: "⚡" },
      { label: "2 weeks: Circulation improves", durationMs: 14 * MS.day, icon: "🩸" },
      { label: "1 year: Heart risk halved", durationMs: MS.year, icon: "🏆" },
    ],
  },
  {
    name: "meditation",
    label: "Meditation / Mindfulness",
    description: "Track meditation sessions",
    icon: "🧘",
    defaultCategory: "health",
    defaultTheme: "purple",
    defaultMode: "count-up",
    defaultSound: "bowls",
    defaultName: "Last Meditation",
    milestones: [
      { label: "Daily Practice", durationMs: MS.day, icon: "🕉️" },
      { label: "7-Day Streak", durationMs: 7 * MS.day, icon: "🌟" },
      { label: "30-Day Streak", durationMs: 30 * MS.day, icon: "🪷" },
    ],
  },
  {
    name: "habit",
    label: "Habit Tracker",
    description: "Track any habit with streak monitoring",
    icon: "✅",
    defaultCategory: "personal",
    defaultTheme: "emerald",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "Habit Timer",
    milestones: [
      { label: "1 Day", durationMs: MS.day, icon: "📌" },
      { label: "1 Week", durationMs: MS.week, icon: "🔥" },
      { label: "1 Month", durationMs: MS.month, icon: "⭐" },
      { label: "100 Days", durationMs: 100 * MS.day, icon: "💯" },
    ],
  },
  {
    name: "event",
    label: "Event Countdown",
    description: "Countdown to any event",
    icon: "🎉",
    defaultCategory: "personal",
    defaultTheme: "amber",
    defaultMode: "count-down",
    defaultSound: "chime",
    defaultName: "Event Countdown",
    milestones: [
      { label: "1 Month Out", durationMs: MS.month, icon: "⏰" },
      { label: "1 Week Out", durationMs: MS.week, icon: "🔔" },
      { label: "Tomorrow!", durationMs: MS.day, icon: "🎊" },
    ],
  },
  {
    name: "custom",
    label: "Custom Timer",
    description: "Create a fully customized timer",
    icon: "⏱️",
    defaultCategory: "personal",
    defaultTheme: "emerald",
    defaultMode: "count-up",
    defaultSound: "none",
    defaultName: "My Timer",
    milestones: [],
  },
];

export function getTemplate(name: string): TemplateConfig {
  return TEMPLATES.find((t) => t.name === name) ?? TEMPLATES[TEMPLATES.length - 1];
}
