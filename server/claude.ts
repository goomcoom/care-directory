import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { AgentAnswer, SearchInput, type ChatRequest, type ChatResponse } from "../shared/schemas";
import { TOWN } from "../shared/directory";
import { describeForTool, describeSearch, searchProviders } from "../shared/search";
import type { AgentStep } from "../shared/types";
import { systemPrompt } from "./prompts.js";

// Zero-arg client: resolves ANTHROPIC_API_KEY (loaded from .env by tsx),
// ANTHROPIC_AUTH_TOKEN, or an `ant auth login` profile.
const client = new Anthropic();

export const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5";

const MAX_ROUNDS = 6;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_providers",
    description: `Search the ${TOWN} health directory. Every filter is optional; combine them to narrow the results. Returns up to eight matching providers with whether each is open now, plus the total count.`,
    input_schema: z.toJSONSchema(SearchInput) as Anthropic.Tool.InputSchema,
  },
];

function assertParsed<T>(parsed: T | null, what: string): T {
  if (parsed === null) {
    throw new Error(`Claude returned a response that could not be parsed as ${what}`);
  }
  return parsed;
}

/**
 * The agent loop: let Claude call search_providers as often as it needs, run
 * each call against the shared directory, then return its structured answer
 * along with the steps it took so the UI can replay them.
 */
export async function runAgent(input: ChatRequest): Promise<ChatResponse> {
  const now = new Date(input.now);
  const steps: AgentStep[] = [];
  const messages: Anthropic.MessageParam[] = input.messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt(now),
      tools: TOOLS,
      messages,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(AgentAnswer),
      },
    });

    const uses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || uses.length === 0) {
      return { steps, answer: assertParsed(response.parsed_output, "a directory answer") };
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: uses.map((use): Anthropic.ToolResultBlockParam => {
        const parsed = SearchInput.safeParse(use.input);
        if (!parsed.success) {
          steps.push({ id: use.id, label: "Search rejected", detail: "invalid filters" });
          return {
            type: "tool_result",
            tool_use_id: use.id,
            is_error: true,
            content: z.prettifyError(parsed.error),
          };
        }
        const result = searchProviders(parsed.data, now);
        steps.push({
          id: use.id,
          label: describeSearch(parsed.data),
          detail: `${result.total} match${result.total === 1 ? "" : "es"}`,
        });
        return {
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(describeForTool(result, now)),
        };
      }),
    });
  }

  throw new Error(`The agent did not finish within ${MAX_ROUNDS} search rounds.`);
}
