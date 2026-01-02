import { z } from "zod";
import { type Tool } from "../types";
import { type SearchProvider } from "./provider";

export const WebSearchInput = z.object({
  query: z.string(),
});

export function createWebSearchTool(
  provider: SearchProvider
): Tool<z.infer<typeof WebSearchInput>, unknown> {
  return {
    name: "web_search",
    description: "Search the web for information",
    schema: WebSearchInput,

    async execute({ query }) {
      return provider.search(query);
    },
  };
}
