# Agentic CLI Starter

An interactive CLI chatbot built with TypeScript that demonstrates agentic AI patterns with tool-calling capabilities.

## Quick Start

```bash
# Install dependencies
npm install

# Start the interactive chat
npx tsx src/index.ts
```

## Features

- **Interactive Chat**: Continuous conversation with the AI agent
- **Slash Commands**: Special commands for controlling the CLI
- **Tool Integration**: Agent can use tools (web search) to answer queries
- **Conversation History**: Maintains context across multiple turns
- **Visual Feedback**: "Thinking..." indicator while agent processes

## Slash Commands

- `/help` - Show available commands
- `/info` - Display session information (messages, tools)
- `/clear` - Clear conversation history
- `/exit` - Exit the CLI

## Usage Example

```
Chat started. Type /help for commands or /exit to quit.

You: What is the weather like today?
Agent: thinking...
Agent: [Agent uses web search tool and responds with weather info]

You: /info

Session Info:
  Messages in history: 3
  Tools available: web_search

You: /exit
Goodbye!
```

## Architecture

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Project Structure

```
src/
├── cli/
│   ├── repl.ts       # Interactive REPL loop
│   ├── commands.ts   # Slash command handlers
│   └── ui.ts         # Terminal UI utilities
├── agent/
│   └── agent.ts      # Agent with conversation history
├── llm/
│   ├── types.ts      # LLM interfaces
│   └── mockLLM.ts    # Mock LLM implementation
├── tools/
│   ├── types.ts      # Tool interfaces
│   └── search/       # Web search tool
└── index.ts          # Entry point
```
