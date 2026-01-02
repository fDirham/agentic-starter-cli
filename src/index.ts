import { Agent } from "./agent/agent";
import { MockLLM } from "./llm/mockLLM";
import { createWebSearchTool } from "./tools/search/webSearch";
import { FakeGoogleSearch } from "./tools/search/fakeGoogle";

const query = process.argv.slice(2).join(" ");

if (!query) {
  console.error("Usage: ai <query>");
  process.exit(1);
}

const llm = new MockLLM();
const searchTool = createWebSearchTool(new FakeGoogleSearch());

const agent = new Agent(
  llm,
  [searchTool],
  "You are a helpful CLI research agent."
);

agent.run(query).then(console.log);
