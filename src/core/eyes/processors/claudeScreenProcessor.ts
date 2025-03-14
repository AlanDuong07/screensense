import { ScreenProcessor } from '../types';
import { ScreenElement } from '../../types';
// Import the Node.js shim for Anthropic SDK to provide the required Web Fetch API
import '@anthropic-ai/sdk/shims/node';
import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';

/**
 * Schema for validating element information returned by Claude
 */
const ElementSchema = z.object({
  description: z.string(),
  coordinate: z.tuple([z.number(), z.number()]),
});

const ElementArraySchema = z.array(ElementSchema);

/**
 * Configuration for Claude API interactions
 */
interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  toolVersion: string;
}

/**
 * Type for element information returned by Claude
 */
interface ClaudeElementInfo {
  description: string;
  coordinate: [number, number];
}

/**
 * A screen processor implementation that uses Claude Computer Use to analyze screenshots
 * and extract actionable elements with their coordinates and descriptions.
 *
 * This processor interprets natural language instructions and translates them
 * into elements that can be interacted with by the automation system.
 */
export class ClaudeScreenProcessor implements ScreenProcessor {
  private config: ClaudeConfig;
  private client: Anthropic;
  private cachedResults: Map<string, ScreenElement[]>;

  /**
   * Creates a new instance of the ClaudeScreenProcessor
   *
   * @param apiKey - The Anthropic API key (optional if ANTHROPIC_API_KEY env variable is set)
   */
  constructor(apiKey?: string) {
    // Try to get API key from constructor param, then environment variable
    const resolvedApiKey = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!resolvedApiKey) {
      console.error(
        'No Anthropic API key provided. The ClaudeScreenProcessor will not function correctly.',
      );
      console.error(
        'Please provide an API key in the constructor or set the ANTHROPIC_API_KEY environment variable.',
      );
    }

    this.config = {
      apiKey: resolvedApiKey || '', // Empty string as fallback to prevent undefined errors
      model: 'claude-3-7-sonnet-20250219',
      maxTokens: 4096,
      toolVersion: '20250124',
    };

    this.client = new Anthropic({ apiKey: this.config.apiKey });
    this.cachedResults = new Map<string, ScreenElement[]>();
  }

  /**
   * Processes a screenshot with a given instruction to extract actionable elements
   *
   * @param screenshot - Base64-encoded string of the screenshot image
   * @param instruction - Natural language instruction describing the task to perform
   * @returns Promise resolving to an array of ScreenElement objects with coordinates and descriptions
   */
  async process(
    screenshot: string,
    instruction: string,
  ): Promise<ScreenElement[]> {
    // If no API key is available, return empty array
    if (!this.config.apiKey) {
      return [];
    }

    // Create a cache key based on the screenshot and instruction
    const cacheKey = `${screenshot.substring(0, 100)}_${instruction}`;

    // Check if we already have results for this input
    if (this.cachedResults.has(cacheKey)) {
      return this.cachedResults.get(cacheKey) || [];
    }

    try {
      // Prepare the messages for Claude API
      const messages: BetaMessageParam[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an AI that analyzes a task and a screenshot of the current state of a web browser, and generates coordinates of all relevant elements needed to complete the task. Based on the task, output in JSON format an array of objects, where each object has a "description" of the UI element and its "coordinate" as an array with x and y values.

              Your current task: ${instruction}. Output only the JSON array of objects, no additional text, thoughts, or explanations. You must not use any markdown formatting.`,
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              id: '1',
              type: 'tool_use',
              name: 'computer',
              input: { action: 'screenshot' },
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: '1',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: screenshot,
                  },
                  cache_control: {
                    type: 'ephemeral',
                  },
                },
              ],
            },
          ],
        },
      ];

      // Determine the correct beta flag based on the tool version
      const betaFlag = this.config.toolVersion.includes('20250124')
        ? 'computer-use-2025-01-24'
        : 'computer-use-2024-10-22';

      // Call the Claude API
      const response = await this.client.beta.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages,
        betas: [betaFlag],
      });

      // Extract and parse the response
      for (const block of response.content) {
        if (block.type === 'text') {
          try {
            // Parse and validate the JSON response
            const parsedData = JSON.parse(block.text);
            const validatedElements: ClaudeElementInfo[] =
              ElementArraySchema.parse(parsedData);

            // Convert to ScreenElement format and cache the results
            const screenElements = validatedElements.map(
              (element: ClaudeElementInfo): ScreenElement => ({
                description: element.description,
                coordinate: element.coordinate,
              }),
            );

            this.cachedResults.set(cacheKey, screenElements);
            return screenElements;
          } catch (parseError) {
            console.error(
              'Failed to parse and validate element information:',
              parseError,
            );
            this.cachedResults.set(cacheKey, []);
            return [];
          }
        }
      }

      // If no text block was found in the response
      return [];
    } catch (error) {
      console.error('Error calling Claude API:', error);
      this.cachedResults.set(cacheKey, []);
      return [];
    }
  }
}
