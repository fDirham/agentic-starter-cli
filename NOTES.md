# TODO

- [x] Allow user to keep chatting and using a tool
- [x] Add actual OpenAI API
- [x] Add error handling for bad tool calls
- [x] Add error handling for open ai not working
- [x] Add actual searching capabilities
- [x] Add debug tools to add logs to file

# How to run

`npx tsx src/index.ts "best sqlite migrations for expo"`

# Learnings

- Use zod to easily turn unstructured json objects into something structured
  - Useful for working with LLMs
- LLM just used as a simple thinking machine but the structure of our agent and it looping is what gives it agentic abilities
