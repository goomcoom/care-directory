// Zod v4 is required by the Anthropic SDK's zodOutputFormat helper, so we use
// the v4 compatibility entry point that ships with zod 3.25+.
import { z } from "zod/v4";
import { CATEGORY_IDS, DISTRICT_IDS } from "./types";

/** Input for the `search_providers` tool. Also used directly by the directory page. */
export const SearchInput = z.object({
  category: z
    .enum(CATEGORY_IDS)
    .optional()
    .describe("Restrict to one kind of service. Omit to search every category."),
  district: z
    .enum(DISTRICT_IDS)
    .optional()
    .describe("Restrict to one part of town. Omit when the person has not said where they are."),
  openNow: z.boolean().optional().describe("Only providers open at the current time."),
  openAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe("Only providers open at this 24-hour time today, e.g. '21:30'. Use for 'late tonight', 'this evening' or 'after work'."),
  nhs: z.boolean().optional().describe("Only providers offering NHS care."),
  walkIn: z.boolean().optional().describe("Only providers that see people without an appointment."),
  accessible: z.boolean().optional().describe("Only providers with step-free, wheelchair access."),
  query: z
    .string()
    .optional()
    .describe(
      "Free text matched against provider tags and descriptions, e.g. 'emergency contraception', 'x-ray', 'new patients'.",
    ),
});
export type SearchInput = z.infer<typeof SearchInput>;

export const AgentAnswer = z.object({
  reply: z
    .string()
    .describe(
      "The reply shown to the person. Plain prose in British English, no markdown or bullet points, one to three short paragraphs. Name each recommended provider and say why it fits.",
    ),
  recommendations: z
    .array(
      z.object({
        providerId: z.string().describe("The id of a provider returned by search_providers."),
        reason: z.string().describe("One short sentence on why this provider fits the request."),
      }),
    )
    .max(4)
    .describe("Up to four providers, best first. Empty when asking a clarifying question with nothing to show yet, or when the request is out of scope."),
  followUp: z
    .string()
    .optional()
    .describe(
      "A single clarifying question when more is needed to recommend well, typically which part of town the person is in. Omit when the recommendations stand on their own.",
    ),
  safety: z
    .string()
    .optional()
    .describe(
      "Only for possible emergencies (chest pain, breathing difficulty, heavy bleeding, stroke signs, overdose, thoughts of suicide): one or two sentences telling the person to call 999 or go to A&E first. Omit otherwise.",
    ),
});
export type AgentAnswer = z.infer<typeof AgentAnswer>;

export const ChatRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
  /** The person's current time, ISO 8601, so "open now" is judged on their clock. */
  now: z.string().datetime({ offset: true }),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

export const AgentStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string().optional(),
});

export const ChatResponse = z.object({
  steps: z.array(AgentStepSchema),
  answer: AgentAnswer,
});
export type ChatResponse = z.infer<typeof ChatResponse>;
