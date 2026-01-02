import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Logger utility for the CLI application
 * Logs to a timestamped file in ./logs directory
 */
class Logger {
  private logFilePath: string;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    const timestamp = this.formatTimestamp(this.startTime);
    this.logFilePath = join(process.cwd(), "logs", `log_${timestamp}.txt`);
    this.ensureLogsDirectory();
  }

  /**
   * Ensures the logs directory exists
   */
  private ensureLogsDirectory(): void {
    try {
      mkdirSync(join(process.cwd(), "logs"), { recursive: true });
    } catch (error) {
      // If directory already exists, ignore the error
      if ((error as any).code !== "EEXIST") {
        throw error;
      }
    }
  }

  /**
   * Formats a date into a timestamp string for the filename
   * Format: YYYY-MM-DD_HH-MM-SS
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Formats a date into a timestamp string for log entries
   * Format: YYYY-MM-DD HH:MM:SS
   */
  private formatLogTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Logs a message to the log file
   * @param message - The message to log
   * @param level - Log level (INFO, ERROR, DEBUG, etc.)
   */
  log(message: string, level: string = "INFO"): void {
    const timestamp = this.formatLogTimestamp(new Date());
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    try {
      appendFileSync(this.logFilePath, logEntry, "utf-8");
    } catch (error) {
      // Fallback to console.error if file writing fails
      console.error("Failed to write to log file:", error);
    }
  }

  /**
   * Logs an info message
   */
  info(message: string): void {
    this.log(message, "INFO");
  }

  /**
   * Logs an error message
   */
  error(message: string): void {
    this.log(message, "ERROR");
  }

  /**
   * Logs a debug message
   */
  debug(message: string): void {
    this.log(message, "DEBUG");
  }

  /**
   * Logs a warning message
   */
  warn(message: string): void {
    this.log(message, "WARN");
  }

  /**
   * Gets the current log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}

// Create a singleton instance
const logger = new Logger();

// Export the logger instance and convenience functions
export { logger };

// Export convenience functions that use the singleton
export const log = (message: string, level?: string) =>
  logger.log(message, level);
export const logInfo = (message: string) => logger.info(message);
export const logError = (message: string) => logger.error(message);
export const logDebug = (message: string) => logger.debug(message);
export const logWarn = (message: string) => logger.warn(message);
