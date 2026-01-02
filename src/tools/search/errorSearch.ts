import { type SearchProvider, type SearchResult } from "./provider";

export class ErrorSearchProvider implements SearchProvider {
  async search(query: string): Promise<SearchResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    throw new Error("ErrorSearchProvider: Simulated search failure");
  }
}
