import { type LLM, type Message } from "../llm/types";
import { type Tool } from "../tools/types";

export class Agent {
  private conversationHistory: Message[] = [];
  private readonly MAX_HISTORY = 10;

  constructor(
    private llm: LLM,
    private tools: Tool<any, any>[],
    private systemPrompt: string
  ) {
    // Initialize with system prompt
    this.conversationHistory.push({
      role: "system",
      content: this.systemPrompt,
    });
  }

  async run(userInput: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userInput,
    });

    // Enforce history cap (keep system prompt + last MAX_HISTORY messages)
    if (this.conversationHistory.length > this.MAX_HISTORY + 1) {
      const systemPrompt = this.conversationHistory[0];
      if (!systemPrompt) throw new Error("System prompt missing");

      this.conversationHistory = [
        systemPrompt,
        ...this.conversationHistory.slice(-this.MAX_HISTORY),
      ];
    }

    while (true) {
      const toolSchemas = this.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      }));

      const response = await this.llm.chat(
        this.conversationHistory,
        toolSchemas
      );

      if (response.type === "tool_call") {
        const tool = this.tools.find((t) => t.name === response.toolName);
        if (!tool) throw new Error("Unknown tool");

        const parsed = tool.schema.parse(response.arguments);
        const result = await tool.execute(parsed);

        this.conversationHistory.push({
          role: "tool",
          name: tool.name,
          content: JSON.stringify(result),
        });
      } else {
        // Add assistant response to history
        this.conversationHistory.push({
          role: "assistant",
          content: response.content,
        });
        return response.content;
      }
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
    // TypeScript now knows systemPrompt is Message, not undefined
    this.conversationHistory = [systemPrompt as Message];
  }

  /**
   * Get list of available tool names
   */
  getToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}
