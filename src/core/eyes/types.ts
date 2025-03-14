import { ScreenElement } from '../types';

/**
 * Interface that all screen processors must implement
 *
 * Screen processors analyze visual inputs and interpret tasks,
 * translating them into actionable elements with coordinates and descriptions.
 *
 * Note: Screen processors often require an LLM with strong coordinate generation abilities,
 * such as Claude Computer Use and OpenAI CUA. The default screen processor, ClaudeScreenProcessor,
 * intentionally utilizes the Claude Computer Use model in a very specific way, to allow for developers
 * using ScreenSense to use any other LLM they'd like for their AI agent's general behavior. Essentially,
 * your custom AI agent delegates to Claude the simple, narrow task of analyzing screenshots and extracting
 * relevant elements.
 */
export interface ScreenProcessor {
  /**
   * Process a screenshot and instruction to identify elements
   *
   * @param screenshot - Base64 encoded string of the screenshot
   * @param instruction - Natural language instruction describing what to look for
   * @returns Array of elements with coordinates and descriptions
   */
  process(screenshot: string, instruction: string): Promise<ScreenElement[]>;
}
