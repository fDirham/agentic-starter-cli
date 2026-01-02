import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import {
  type LLM,
  type Message,
  type LLMResponse,
  type ToolSchema,
} from "./types";

export class OpenAILLM implements LLM {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not found in environment variables.");
    }
    this.client = new OpenAI({ apiKey });
    this.model = "gpt-4o-mini";
  }

  async chat(messages: Message[], tools: ToolSchema[]): Promise<LLMResponse> {
    // Convert our message format to OpenAI's format
    const openaiMessages = this.convertMessages(messages);

    // Convert our tool schemas to OpenAI's function format
    const openaiTools = this.convertTools(tools);

    // Make the API call with proper type handling
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.model,
      messages: openaiMessages,
      ...(openaiTools.length > 0 && {
        tools: openaiTools,
        tool_choice: "auto" as const,
      }),
    };

    const response = await this.client.chat.completions.create(params);

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("No response from OpenAI");
    }

    const message = choice.message;

    // Check if the model wants to call a tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0]; // Take the first tool call
      if (!toolCall) {
        throw new Error("Tool call is undefined");
      }

      // Type guard to ensure we have a function tool call
      if (toolCall.type !== "function") {
        throw new Error("Unsupported tool call type");
      }

      // Convert all tool calls to our format
      const rawToolCalls = message.tool_calls
        .filter((tc) => tc.type === "function")
        .map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: tc.function.arguments,
        }));

      return {
        type: "tool_call",
        toolName: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
        toolCallId: toolCall.id,
        rawToolCalls,
      };
    }

    // Otherwise, return the final text response
    return {
      type: "final",
      content: message.content ?? "",
    };
  }

  private convertMessages(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === "tool") {
        // For tool messages, use the tool_call_id from the message
        return {
          role: "tool",
          content: msg.content,
          tool_call_id: msg.tool_call_id ?? "unknown",
        };
      }

      if (msg.role === "assistant" && msg.tool_calls) {
        // For assistant messages with tool calls
        return {
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.tool_calls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          })),
        };
      }

      // For other roles, map directly
      return {
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      };
    });
  }

  private convertTools(tools: ToolSchema[]): ChatCompletionTool[] {
    return tools.map((tool) => {
      return {
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters as Record<string, unknown>,
        },
      };
    });
  }
}
