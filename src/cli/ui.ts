/**
 * UI utilities for terminal manipulation and formatting
 */
export class UI {
  /**
   * Show a thinking indicator on the current line
   */
  static showThinking(): void {
    process.stdout.write("Agent: thinking...");
  }

  /**
   * Clear the current line using ANSI escape codes
   */
  static clearLine(): void {
    process.stdout.write("\r\x1b[K"); // \r = carriage return, \x1b[K = clear line
  }

  /**
   * Clear the thinking indicator and show the agent's response
   */
  static showAgentResponse(text: string): void {
    this.clearLine();
    console.log(`Agent: ${text}`);
  }
}
