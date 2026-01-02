import "dotenv/config";
import { Agent } from "./agent/agent";
import { OpenAILLM } from "./llm/openaiLLM";
import { createWebSearchTool } from "./tools/search/webSearch";
import { FakeGoogleSearch } from "./tools/search/fakeGoogle";
import { REPL } from "./cli/repl";

// Load OpenAI API key from environment
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY not found in environment variables.");
  console.error("Please create a .env file with your OpenAI API key.");
  console.error("See .env.example for reference.");
  process.exit(1);
}

const llm = new OpenAILLM(apiKey);
const searchTool = createWebSearchTool(new FakeGoogleSearch());

const agent = new Agent(
  llm,
  [searchTool],
  "You are a helpful CLI research agent."
);

const repl = new REPL(agent);
repl.start();
