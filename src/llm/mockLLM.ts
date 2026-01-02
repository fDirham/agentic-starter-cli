import { type LLM, type Message, type LLMResponse } from "./types";

export class MockLLM implements LLM {
  async chat(messages: Message[]): Promise<LLMResponse> {
    const last = messages[messages.length - 1];

    if (!last) {
      throw new Error("No messages provided");
    }

    if (last.role === "user") {
      return {
        type: "tool_call",
        toolName: "web_search",
        arguments: { query: last.content },
      };
    }

    if (last.role === "tool") {
      return {
        type: "final",
        content: `Here are the search results:\n${last.content}`,
      };
    }

    throw new Error("Unhandled state");
  }
}
