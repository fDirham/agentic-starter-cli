import { type SearchProvider } from "./provider";

export class FakeGoogleSearchProvider implements SearchProvider {
  async search(_query: string) {
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
