import {
  type LLM,
  type Message,
  type LLMResponse,
  type ToolSchema,
} from "./types";

export class ErrorLLM implements LLM {
  async chat(_messages: Message[], _tools: ToolSchema[]): Promise<LLMResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    throw new Error("ErrorLLM: Simulated LLM failure");
  }
}
