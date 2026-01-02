# Agentic CLI Starter

## Overview

Starter code for a CLI-based AI agentic chatbot with tool-calling capabilities. Vibe coded this to understand apps like Claude Code better.

## Ways to extend / configure:

- Add more tools
- Add more complex history management logic
- Add more LLM models
- Better agentic reasoning

## High level inner-workings

- index.ts starts a Read-Event-Print Loop
  - `repl.ts` responsible for coordinating user input, agents, and UI
- REPL calls our agent
- Agent calls LLM with chat history + tools
- On a tool call, our agent calls the respective tools and appends results to chat history
- Repeat agent call until agent does not need a tool call
- Once agent responds without tool call, REPL updates UI to inform user the results
- The loop starts again

## Quick Start

```bash
# Install dependencies
npm install

# Start the interactive chat
npm run start
```

## Features

- **Interactive Chat**: Continuous conversation with the AI agent
- **Slash Commands**: Special commands for controlling the CLI
- **Tool Integration**: Agent can use tools (web search) to answer queries
- **Conversation History**: Maintains context across multiple turns
- **Visual Feedback**: "Thinking..." indicator while agent processes
- **Error Handling**: Tool or LLM failures are accounted for.
- **File logging**: Logs are saved to file per chatting session using a custom logger.

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

See [AGENT.md](AGENT.md) for detailed architecture documentation.
