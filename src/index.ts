import { Agent } from "./agent/agent";
import { MockLLM } from "./llm/mockLLM";
import { createWebSearchTool } from "./tools/search/webSearch";
import { FakeGoogleSearch } from "./tools/search/fakeGoogle";
import { REPL } from "./cli/repl";

const llm = new MockLLM();
const searchTool = createWebSearchTool(new FakeGoogleSearch());

const agent = new Agent(
  llm,
  [searchTool],
  "You are a helpful CLI research agent."
);

const repl = new REPL(agent);
repl.start();
