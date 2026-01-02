import { type LLM, type Message } from "../llm/types";
import { type Tool } from "../tools/types";
import * as fs from "fs/promises";
import * as path from "path";

export class Agent {
  private conversationHistory: Message[] = [];
  private fullHistory: Message[] = []; // Separate full history for debugging
  private readonly MAX_HISTORY = 10;

  constructor(
    private llm: LLM,
    private tools: Tool<any, any>[],
    private systemPrompt: string
  ) {
    // Initialize with system prompt
    this.addToHistory({
      role: "system",
      content: this.systemPrompt,
    });
  }

  /**
   * Helper to add messages to both conversation history and full history
   */
  private addToHistory(message: Message): void {
    this.conversationHistory.push(message);
    this.fullHistory.push(message);
  }

  async run(userInput: string): Promise<string> {
    // Add user message to history
    this.addToHistory({
      role: "user",
      content: userInput,
    });

    // Enforce history cap (keep system prompt + last MAX_HISTORY messages)
    // Note: fullHistory is never capped, only conversationHistory
    if (this.conversationHistory.length > this.MAX_HISTORY + 1) {
      const systemPrompt = this.conversationHistory[0];
      if (!systemPrompt) throw new Error("System prompt missing");

      this.conversationHistory = [
        systemPrompt,
        ...this.conversationHistory.slice(-this.MAX_HISTORY),
      ];
    }

    const toolSchemas = this.tools.map((tool) => {
      // Convert Zod schema to JSON Schema if it has toJSONSchema method
      let parameters: unknown = tool.schema;
      if (
        parameters &&
        typeof parameters === "object" &&
        "toJSONSchema" in parameters &&
        typeof parameters.toJSONSchema === "function"
      ) {
        parameters = parameters.toJSONSchema();
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters,
      };
    });

    while (true) {
      const response = await this.llm.chat(
        this.conversationHistory,
        toolSchemas
      );

      if (response.type === "tool_call") {
        // Add the assistant's tool call message to history first
        this.addToHistory({
          role: "assistant",
          content: "",
          tool_calls: response.rawToolCalls,
        });

        // Execute ALL tool calls and add their results
        for (const toolCall of response.rawToolCalls) {
          const tool = this.tools.find((t) => t.name === toolCall.name);
          if (!tool) {
            throw new Error(`Unknown tool: ${toolCall.name}`);
          }

          // Parse the arguments for this specific tool call
          const args = JSON.parse(toolCall.arguments);
          const parsed = tool.schema.parse(args);
          const result = await tool.execute(parsed);

          // Add the tool result with the tool_call_id
          this.addToHistory({
            role: "tool",
            name: tool.name,
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          });
        }

        await this.saveFullHistory();
      } else {
        // Add assistant response to history
        this.addToHistory({
          role: "assistant",
          content: response.content,
        });

        await this.saveFullHistory();

        return response.content;
      }
    }
  }

  /**
   * Save full conversation history to file for debugging
   */
  private async saveFullHistory(): Promise<void> {
    try {
      const historyText = this.fullHistory
        .map((msg, index) => {
          const header = `[${index}] ${msg.role.toUpperCase()}`;
          let content = `Content: ${msg.content}`;

          if (msg.tool_calls) {
            content += `\nTool Calls: ${JSON.stringify(
              msg.tool_calls,
              null,
              2
            )}`;
          }

          if (msg.tool_call_id) {
            content += `\nTool Call ID: ${msg.tool_call_id}`;
          }

          if (msg.name) {
            content += `\nTool Name: ${msg.name}`;
          }

          return `${header}\n${content}\n${"=".repeat(80)}`;
        })
        .join("\n\n");

      await fs.writeFile(
        path.join(process.cwd(), "last_chat.txt"),
        historyText,
        "utf-8"
      );
    } catch (error) {
      // Silently fail - don't break the chat if file writing fails
      console.error("Failed to save chat history:", error);
    }
  }

  /**
   * Get the current conversation history
   */
  getHistory(): Message[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history (preserves system prompt)
   */
  clearHistory(): void {
    const systemPrompt = this.conversationHistory[0];
    if (!systemPrompt) {
      throw new Error("System prompt missing");
    }
    // Clear both histories
    this.conversationHistory = [systemPrompt as Message];
    this.fullHistory = [systemPrompt as Message];
  }

  /**
   * Get list of available tool names
   */
  getToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}
