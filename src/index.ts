import "dotenv/config";
import { Agent } from "./agent/agent";
import { OpenAILLM } from "./llm/openaiLLM";
import { createWebSearchTool } from "./tools/search/webSearch";
import { REPL } from "./cli/repl";
import { logger, logInfo } from "./utils/logger";
import { FakeGoogleSearchProvider } from "./tools/search/fakeGoogle";
// import { ErrorLLM } from "./llm/errorLLM";
// import { ErrorSearchProvider } from "./tools/search/errorSearch";

const llm = new OpenAILLM();
// const llm = new ErrorLLM();
// const searchProvider = new ErrorSearchProvider();
const searchProvider = new FakeGoogleSearchProvider();
const searchTool = createWebSearchTool(searchProvider);

const agent = new Agent(
  llm,
  [searchTool],
  "You are a helpful CLI research agent."
);

// Initialize logger and log startup
logInfo("Application started");
logInfo(`Log file: ${logger.getLogFilePath()}`);

const repl = new REPL(agent);
repl.start();
