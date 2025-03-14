import { ClaudeScreenProcessor } from './processors/claudeScreenProcessor';
import { ScreenProcessor } from './types';

/**
 * Factory to manage screen processors
 *
 * This factory provides a registry for different screen processors
 * and handles their retrieval based on name.
 */
export class ScreenProcessorFactory {
  private static registry: Record<string, ScreenProcessor> = {};

  /**
   * Register a custom screen processor
   *
   * @param name - Unique identifier for the processor
   * @param processor - Screen processor implementation
   */
  static registerScreenProcessor(
    name: string,
    processor: ScreenProcessor,
  ): void {
    this.registry[name] = processor;
  }

  /**
   * Retrieve a screen processor by name, or use the default if not found
   *
   * @param customProcessorName - Optional name of the processor to retrieve
   * @returns The requested processor or default ClaudeScreenProcessor
   */
  static getScreenProcessor = (
    customProcessorName?: string,
  ): ScreenProcessor => {
    if (customProcessorName && this.registry[customProcessorName]) {
      return this.registry[customProcessorName];
    }
    return new ClaudeScreenProcessor();
  };
}
