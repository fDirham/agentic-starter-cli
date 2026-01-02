# CLAUDE.md

This file provides guidance to AI agents when working with code in this repository.

# Things to always do

- Always plan and not edge cases and possible logical flaws when asked to implement something.
- Ask for user sign off before executing such a plan.

# Project stuff

## Project Overview

This is an agentic CLI starter project that demonstrates building AI agents with tool-calling capabilities. It implements a research agent that can use web search tools to answer queries.

## Running the Project

```bash
# Start the interactive chat CLI
npx tsx src/index.ts
```

The CLI starts an interactive REPL (Read-Eval-Print Loop) where you can chat with the agent. Type messages to chat or use slash commands for special actions.

## Interactive CLI Features

**REPL System** ([src/cli/repl.ts](src/cli/repl.ts)):

- Interactive chat loop using Node.js `readline/promises`
- Persistent conversation history across multiple turns
- Visual "thinking..." indicator while agent processes requests
- Graceful error handling and Ctrl+C shutdown

**Slash Commands** ([src/cli/commands.ts](src/cli/commands.ts)):

- `/exit` - Exit the CLI
- `/clear` - Clear conversation history (preserves system prompt)
- `/help` - Show available commands
- `/info` - Display session information (message count, available tools)

**Conversation Management**:

- Automatically maintains last 10 messages + system prompt
- Older messages are pruned to prevent token overflow
- System prompt is always preserved

## Core Architecture

### Agent Loop Pattern

The heart of this project is the **Agent** class ([src/agent/agent.ts](src/agent/agent.ts)), which implements an agentic loop:

1. LLM receives messages + available tools
2. LLM responds with either a tool call or final answer
3. If tool call: execute tool, add result to messages, loop back to step 1
4. If final answer: return to user

This loop continues until the LLM decides to provide a final response instead of calling another tool.

### Key Architectural Layers

**LLM Abstraction** ([src/llm/types.ts](src/llm/types.ts)):

- `LLM` interface defines contract for language models
- `LLMResponse` is a discriminated union: either `tool_call` or `final`
- Messages use roles: `system`, `user`, `assistant`, `tool`
- Agent maintains conversation history internally for multi-turn conversations
- Currently implemented with `MockLLM` ([src/llm/mockLLM.ts](src/llm/mockLLM.ts)) which hardcodes behavior for demo purposes

**Tool System** ([src/tools/types.ts](src/tools/types.ts)):

- Tools are defined by the `Tool<TInput, TOutput>` interface
- Each tool has: name, description, Zod schema for validation, and execute function
- Zod schemas serve dual purpose: runtime validation + LLM tool schema generation
- Tools are dependency-injected into the Agent constructor

**Provider Pattern** ([src/tools/search/provider.ts](src/tools/search/provider.ts)):

- Tools can wrap external providers via interfaces (e.g., `SearchProvider`)
- This allows swapping implementations (currently uses `FakeGoogleSearch` stub)
- The `createWebSearchTool` factory creates a Tool from a SearchProvider

### Key Design Principles

From [LEARNINGS.md](LEARNINGS.md):

- Use Zod to turn unstructured JSON (from LLMs) into structured, validated data
- The LLM is just a "thinking machine" - the agentic behavior comes from the loop structure
- The agent autonomously decides when to use tools and when to return results

## TypeScript Configuration

- Uses ES modules (`"type": "module"` in package.json)
- Configured with strict type checking and recommended options
- Target: ESNext with bundler module resolution
- Notable strictness: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

## Extending the System

### Adding a New Tool

1. Define input schema with Zod
2. Implement `Tool<TInput, TOutput>` interface
3. Pass tool instance to Agent constructor

### Replacing the LLM

1. Implement the `LLM` interface ([src/llm/types.ts](src/llm/types.ts))
2. Parse tool schemas and return proper `LLMResponse` discriminated union
3. Inject into Agent instead of MockLLM

### Adding or Modifying Slash Commands

**Adding a new command:**

1. Create a command handler in [src/cli/commands.ts](src/cli/commands.ts):

   ```typescript
   export const myCommand: CommandHandler = (ctx) => {
     // Access agent via ctx.agent
     console.log("Command output here");
   };
   ```

2. Register the command in [src/cli/repl.ts](src/cli/repl.ts) in the `registerCommands()` method:

   ```typescript
   this.commandRegistry.register("/mycommand", myCommand);
   ```

3. Update the `/help` command in [src/cli/commands.ts](src/cli/commands.ts) to document your new command

**Command handler signature:**

```typescript
type CommandHandler = (context: CommandContext) => void | Promise<void>;

interface CommandContext {
  agent: Agent; // Access to agent instance for history, tools, etc.
}
```

**Example - Adding a `/history` command:**

```typescript
// In src/cli/commands.ts
export const historyCommand: CommandHandler = (ctx) => {
  const messages = ctx.agent.getHistory();
  console.log("\nConversation History:");
  messages.forEach((msg, i) => {
    console.log(`${i}. [${msg.role}]: ${msg.content}`);
  });
};

// In src/cli/repl.ts registerCommands()
this.commandRegistry.register("/history", historyCommand);
```

**Modifying existing commands:**

Simply edit the command handler in [src/cli/commands.ts](src/cli/commands.ts). All commands are exported as named exports (`exitCommand`, `clearCommand`, `helpCommand`, `infoCommand`).

## Logging

NEVER USE `console.log` or `console.error`
Use functions defined in `utils/logger` to log to a log file.

What's defined:

```ts
export const log = (message: string, level?: string) =>
  logger.log(message, level);
export const logInfo = (message: string) => logger.info(message);
export const logError = (message: string) => logger.error(message);
export const logDebug = (message: string) => logger.debug(message);
export const logWarn = (message: string) => logger.warn(message);
```

## Testing

This project uses vitest. Add test files in `/test/`
