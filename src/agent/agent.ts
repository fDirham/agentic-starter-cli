import { type LLM, type Message } from "../llm/types";
import { type Tool } from "../tools/types";
import * as fs from "fs/promises";
import * as path from "path";
import { logDebug } from "../utils/logger";

export class Agent {
  private conversationHistory: Message[] = [];
  private fullHistory: Message[] = []; // Separate full history for debugging
  private readonly MAX_HISTORY = 10;

  constructor(
    private llm: LLM,
    private tools: Tool<any, any>[],
    private systemPrompt: string
  ) {
    logDebug("Agent initialized with system prompt: " + systemPrompt);
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

  /**
   * Execute a tool with retry logic (up to 3 attempts)
   */
  private async executeToolWithRetry<TInput, TOutput>(
    tool: Tool<TInput, TOutput>,
    input: TInput,
    toolCallId: string,
    maxRetries: number = 3
  ): Promise<TOutput | { error: string }> {
    let lastError: Error | unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await tool.execute(input);
      } catch (error) {
        lastError = error;

        // If this isn't the last attempt, continue to retry
        if (attempt < maxRetries) {
          continue;
        }
      }
    }

    // All retries failed - return error object
    const errorMessage =
      lastError instanceof Error ? lastError.message : "Unknown error occurred";

    return {
      error: `Tool execution failed after ${maxRetries} attempts: ${errorMessage}`,
    };
  }

  /**
   * Call LLM with retry logic (up to 3 attempts)
   */
  private async callLLMWithRetry(
    messages: Message[],
    toolSchemas: any[],
    maxRetries: number = 3
  ): Promise<
    | { success: true; response: Awaited<ReturnType<LLM["chat"]>> }
    | { success: false; error: string }
  > {
    let lastError: Error | unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.llm.chat(messages, toolSchemas);
        return { success: true, response };
      } catch (error) {
        lastError = error;

        // If this isn't the last attempt, continue to retry
        if (attempt < maxRetries) {
          continue;
        }
      }
    }

    // All retries failed - return error
    const errorMessage =
      lastError instanceof Error ? lastError.message : "Unknown error occurred";

    return {
      success: false,
      error: `LLM call failed after ${maxRetries} attempts: ${errorMessage}`,
    };
  }

  async run(userInput: string): Promise<string> {
    logDebug(`Running agent with user input: ${userInput}`);

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
    logDebug("Tool schemas prepared: " + JSON.stringify(toolSchemas));

    while (true) {
      logDebug(
        "Calling LLM with current conversation history: " +
          JSON.stringify(this.conversationHistory)
      );

      const llmResult = await this.callLLMWithRetry(
        this.conversationHistory,
        toolSchemas
      );

      logDebug("LLM call result: " + JSON.stringify(llmResult));

      // Handle LLM failure
      if (!llmResult.success) {
        const errorMessage = `I'm sorry, I encountered an error while processing your request. ${llmResult.error}`;

        // Add error response to history
        this.addToHistory({
          role: "assistant",
          content: errorMessage,
        });

        return errorMessage;
      }

      const response = llmResult.response;

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
            this.addToHistory({
              role: "tool",
              name: toolCall.name,
              content: JSON.stringify({ error: "Tool not found" }),
              tool_call_id: toolCall.id,
            });
            continue;
          }

          // Parse the arguments for this specific tool call
          const args = JSON.parse(toolCall.arguments);
          const parsed = tool.schema.parse(args);

          // Execute tool with retry logic
          logDebug(
            `Executing tool ${tool.name} with arguments: ${JSON.stringify(
              parsed
            )}`
          );

          const result = await this.executeToolWithRetry(
            tool,
            parsed,
            toolCall.id
          );

          logDebug(
            `Tool ${tool.name} execution result: ${JSON.stringify(result)}`
          );

          // Add the tool result with the tool_call_id
          this.addToHistory({
            role: "tool",
            name: tool.name,
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          });
        }
      } else {
        // Add assistant response to history
        this.addToHistory({
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
