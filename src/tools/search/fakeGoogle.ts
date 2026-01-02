import { type SearchProvider } from "./provider";

export class FakeGoogleSearch implements SearchProvider {
  async search(query: string) {
    return [
      {
        title: "Expo SQLite Migrations",
        url: "https://docs.expo.dev/versions/latest/sdk/sqlite/",
        snippet: "Expo SQLite supports migrations via...",
      },
      {
        title: "Drizzle ORM",
        url: "https://orm.drizzle.team/",
        snippet: "Type-safe SQL ORM with migration support",
      },
    ];
  }
}
