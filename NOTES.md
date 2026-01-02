# TODO

- [x] Allow user to keep chatting and using a tool
- [x] Add actual OpenAI API
- [] Add error handling for bad tool calls
- [] Add error handling for open ai not working
- [] Add actual searching capabilities

# How to run

`npx tsx src/index.ts "best sqlite migrations for expo"`

# Learnings

- Use zod to easily turn unstructured json objects into something structured
  - Useful for working with LLMs
- LLM just used as a simple thinking machine but the structure of our agent and it looping is what gives it agentic abilities
