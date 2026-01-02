export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string;
  name?: string; // used for tool messages
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: unknown; // JSON Schema / Zod-inferred
}

export type LLMResponse =
  | { type: "tool_call"; toolName: string; arguments: unknown }
  | { type: "final"; content: string };

export interface LLM {
  chat(messages: Message[], tools: ToolSchema[]): Promise<LLMResponse>;
}
