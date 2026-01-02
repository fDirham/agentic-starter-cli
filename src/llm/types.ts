export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface Message {
  role: Role;
  content: string;
  name?: string; // used for tool messages
  tool_calls?: ToolCall[]; // used for assistant messages with tool calls
  tool_call_id?: string; // used for tool response messages
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: unknown; // JSON Schema / Zod-inferred
}

export type LLMResponse =
  | {
      type: "tool_call";
      toolName: string;
      arguments: unknown;
      toolCallId: string;
      rawToolCalls: ToolCall[];
    }
  | { type: "final"; content: string };

export interface LLM {
  chat(messages: Message[], tools: ToolSchema[]): Promise<LLMResponse>;
}
