import { type LLM, type Message } from "../llm/types";
import { type Tool } from "../tools/types";

export class Agent {
  constructor(
    private llm: LLM,
    private tools: Tool<any, any>[],
    private systemPrompt: string
  ) {}

  async run(userInput: string): Promise<string> {
    const messages: Message[] = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: userInput },
    ];

    while (true) {
      const toolSchemas = this.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      }));

      const response = await this.llm.chat(messages, toolSchemas);

      if (response.type === "tool_call") {
        const tool = this.tools.find((t) => t.name === response.toolName);
        if (!tool) throw new Error("Unknown tool");

        const parsed = tool.schema.parse(response.arguments);
        const result = await tool.execute(parsed);

        messages.push({
          role: "tool",
          name: tool.name,
          content: JSON.stringify(result),
        });
      } else {
        return response.content;
      }
    }
  }
}
