import type { Agent } from "../agent/agent";
import type { Message } from "../llm/types";

/**
 * Context passed to command handlers
 */
export interface CommandContext {
  agent: Agent;
}

/**
 * Command handler function signature
 */
export type CommandHandler = (context: CommandContext) => void | Promise<void>;

/**
 * Registry for slash commands
 */
export class CommandRegistry {
  private commands: Map<string, CommandHandler> = new Map();

  /**
   * Register a command handler
   */
  register(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
  }

  /**
   * Execute a command by name
   * @returns true if command was found and executed, false otherwise
   */
  async execute(command: string, context: CommandContext): Promise<boolean> {
    const handler = this.commands.get(command);
    if (!handler) {
      console.log(`Command not recognized: ${command}`);
      console.log(`Type /help to see available commands.`);
      return false;
    }
    await handler(context);
    return true;
  }

  /**
   * Check if input is a slash command
   */
  isCommand(input: string): boolean {
    return input.startsWith("/");
  }

  /**
   * Parse command name from input
   */
  parseCommand(input: string): string {
    const command = input.split(" ")[0];
    if (!command) {
      throw new Error("Invalid command format");
    }
    return command;
  }
}

/**
 * /exit command - exits the CLI
 */
export const exitCommand: CommandHandler = () => {
  console.log("Goodbye!");
  process.exit(0);
};

/**
 * /clear command - clears conversation history (preserves system prompt)
 */
export const clearCommand: CommandHandler = (ctx) => {
  ctx.agent.clearHistory();
  console.log("Conversation history cleared.");
};

/**
 * /help command - shows available commands
 */
export const helpCommand: CommandHandler = () => {
  console.log(`
Available commands:
  /exit  - Exit the CLI
  /clear - Clear conversation history
  /help  - Show this help message
  /info  - Show session information
  `);
};

/**
 * /info command - shows session information
 */
export const infoCommand: CommandHandler = (ctx) => {
  const history = ctx.agent.getHistory();
  const toolNames = ctx.agent.getToolNames();

  console.log(`
Session Info:
  Messages in history: ${history.length}
  Tools available: ${toolNames.length > 0 ? toolNames.join(", ") : "none"}
  `);
};
