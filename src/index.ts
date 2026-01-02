import "dotenv/config";
import { Agent } from "./agent/agent";
import { OpenAILLM } from "./llm/openaiLLM";
import { createWebSearchTool } from "./tools/search/webSearch";
import { REPL } from "./cli/repl";
import { GoogleSearchProvider } from "./tools/search/googleSearch";
// import { ErrorLLM } from "./llm/errorLLM";
// import { ErrorSearchProvider } from "./tools/search/errorSearch";

const llm = new OpenAILLM();
// const llm = new ErrorLLM();
// const searchProvider = new ErrorSearchProvider();
const searchProvider = new GoogleSearchProvider();
const searchTool = createWebSearchTool(searchProvider);

const agent = new Agent(
  llm,
  [searchTool],
  "You are a helpful CLI research agent."
);

const repl = new REPL(agent);
repl.start();
