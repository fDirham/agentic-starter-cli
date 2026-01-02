import * as readline from "readline/promises";
import type { Agent } from "../agent/agent";
import {
  CommandRegistry,
  type CommandContext,
  exitCommand,
  clearCommand,
  helpCommand,
  infoCommand,
} from "./commands";
import { UI } from "./ui";

/**
 * REPL (Read-Eval-Print Loop) for interactive chat with the agent
 */
export class REPL {
  private rl: readline.Interface;
  private commandRegistry: CommandRegistry;
  private isRunning: boolean = false;

  constructor(private agent: Agent) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.commandRegistry = new CommandRegistry();
    this.registerCommands();
    this.setupSignalHandlers();
  }

  /**
   * Register all available slash commands
   */
  private registerCommands(): void {
    this.commandRegistry.register("/exit", exitCommand);
    this.commandRegistry.register("/clear", clearCommand);
    this.commandRegistry.register("/help", helpCommand);
    this.commandRegistry.register("/info", infoCommand);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on("SIGINT", () => {
      console.log("\nGoodbye!");
      process.exit(0);
    });
  }

  /**
   * Start the interactive REPL loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log("Chat started. Type /help for commands or /exit to quit.\n");

    while (this.isRunning) {
      try {
        const input = await this.rl.question("You: ");

        // Skip empty input
        if (!input.trim()) {
          continue;
        }

        // Check if input is a slash command
        if (this.commandRegistry.isCommand(input)) {
          const command = this.commandRegistry.parseCommand(input);
          const context: CommandContext = {
            agent: this.agent,
          };
          await this.commandRegistry.execute(command, context);
          continue;
        }

        // Regular chat message - run agent
        UI.showThinking();
        const response = await this.agent.run(input);
        UI.showAgentResponse(response);
      } catch (error) {
        UI.clearLine();
        console.error(
          "Error:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * Stop the REPL loop
   */
  stop(): void {
    this.isRunning = false;
    this.rl.close();
  }
}
