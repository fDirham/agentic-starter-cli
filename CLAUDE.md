# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Things to always do

- Always plan and not edge cases and possible logical flaws when asked to implement something.
  - Ask for user sign off before executing such a plan.

# Project stuff

## Project Overview

This is an agentic CLI starter project that demonstrates building AI agents with tool-calling capabilities. It implements a research agent that can use web search tools to answer queries.

## Running the Project

```bash
# Run the CLI with a query
npx ts-node src/index.ts <query>
```

The CLI accepts a query as command-line arguments and runs the agent to process it.

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

## Extending the Agent

**Adding a new tool:**

1. Define input schema with Zod
2. Implement `Tool<TInput, TOutput>` interface
3. Pass tool instance to Agent constructor

**Replacing the LLM:**

1. Implement the `LLM` interface ([src/llm/types.ts](src/llm/types.ts))
2. Parse tool schemas and return proper `LLMResponse` discriminated union
3. Inject into Agent instead of MockLLM
