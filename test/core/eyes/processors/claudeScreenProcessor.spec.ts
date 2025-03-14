/**
 * Tests for the ClaudeScreenProcessor class which uses Claude's Computer Use capabilities
 * to analyze screenshots and extract elements with their coordinates and descriptions.
 */

const mockBetaMessagesCreate = jest.fn();
const mockAnthropicInstance = {
  beta: {
    messages: {
      create: mockBetaMessagesCreate,
    },
  },
};

jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn(() => mockAnthropicInstance),
}));

jest.mock('zod', () => ({
  z: {
    object: jest.fn().mockReturnThis(),
    string: jest.fn().mockReturnThis(),
    number: jest.fn().mockReturnThis(),
    tuple: jest.fn().mockReturnThis(),
    array: jest.fn().mockReturnThis(),
    parse: jest.fn(<T>(data: T): T => data),
  },
}));

import { ClaudeScreenProcessor } from '../../../../src/core/eyes/processors/claudeScreenProcessor';
import { ScreenElement } from '../../../../src/core/types';
import { Anthropic } from '@anthropic-ai/sdk';
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/beta/messages';

describe('ClaudeScreenProcessor', () => {
  let originalEnv: NodeJS.ProcessEnv;

  const testApiKey = 'test-api-key';
  const testScreenshot = 'base64-encoded-screenshot';
  const testInstruction = 'Find the login button';

  const mockElements: ScreenElement[] = [
    {
      description: 'Login button',
      coordinate: [100, 200],
    },
    {
      description: 'Username field',
      coordinate: [150, 250],
    },
  ];

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with API key from constructor parameter', () => {
      new ClaudeScreenProcessor(testApiKey);

      expect(Anthropic).toHaveBeenCalledWith({ apiKey: testApiKey });
    });

    it('should initialize with API key from environment variable', () => {
      process.env.ANTHROPIC_API_KEY = 'env-api-key';

      new ClaudeScreenProcessor();

      expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'env-api-key' });
    });

    it('should initialize with empty API key if none provided', () => {
      delete process.env.ANTHROPIC_API_KEY;

      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      new ClaudeScreenProcessor();

      expect(Anthropic).toHaveBeenCalledWith({ apiKey: '' });
      expect(console.error).toHaveBeenCalledTimes(2);

      console.error = originalConsoleError;
    });
  });

  describe('process', () => {
    it('should process screenshot and return elements', async () => {
      mockBetaMessagesCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockElements),
          },
        ],
      });

      const processor = new ClaudeScreenProcessor(testApiKey);

      const result = await processor.process(testScreenshot, testInstruction);

      expect(mockBetaMessagesCreate).toHaveBeenCalledTimes(1);

      const mockCalls = mockBetaMessagesCreate.mock?.calls as unknown as Array<
        [MessageCreateParams]
      >;
      const callArgs = mockCalls[0][0];
      expect(callArgs.model).toBe('claude-3-7-sonnet-20250219');
      expect(callArgs.max_tokens).toBe(4096);
      expect(callArgs.betas).toContain('computer-use-2025-01-24');

      const messages = callArgs.messages;

      const firstContentBlock = messages[0]?.content?.[0];
      if (
        firstContentBlock &&
        typeof firstContentBlock !== 'string' &&
        'type' in firstContentBlock &&
        firstContentBlock.type === 'text' &&
        'text' in firstContentBlock
      ) {
        expect(firstContentBlock.text).toContain(testInstruction);
      }

      const imageContentBlock = messages[2]?.content?.[0];
      if (
        imageContentBlock &&
        typeof imageContentBlock !== 'string' &&
        'type' in imageContentBlock &&
        imageContentBlock.type === 'image' &&
        'source' in imageContentBlock &&
        imageContentBlock.source &&
        typeof imageContentBlock.source === 'object' &&
        'data' in imageContentBlock.source
      ) {
        expect(imageContentBlock.source.data).toBe(testScreenshot);
      }

      expect(result).toEqual(mockElements);
    });

    it('should return empty array if no API key is available', async () => {
      // Create processor with no API key
      const processor = new ClaudeScreenProcessor('');

      const result = await processor.process(testScreenshot, testInstruction);

      expect(mockBetaMessagesCreate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return cached results for the same input', async () => {
      mockBetaMessagesCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockElements),
          },
        ],
      });

      const processor = new ClaudeScreenProcessor(testApiKey);

      // First call should make API request
      const firstResult = await processor.process(
        testScreenshot,
        testInstruction,
      );
      expect(firstResult).toEqual(mockElements);

      mockBetaMessagesCreate.mockClear();

      // Second call with same input should use cache
      const result = await processor.process(testScreenshot, testInstruction);

      expect(mockBetaMessagesCreate).not.toHaveBeenCalled();
      expect(result).toEqual(mockElements);
    });

    it('should return empty array when cache returns null', async () => {
      const processor = new ClaudeScreenProcessor(testApiKey);

      const mockMap = new Map<string, ScreenElement[]>();
      jest.spyOn(mockMap, 'has').mockImplementation(() => true);
      jest
        .spyOn(mockMap, 'get')
        .mockImplementation(
          () => null as unknown as ScreenElement[] | undefined,
        );

      processor['cachedResults'] = mockMap;

      // Call process - this should trigger the cache path
      const result = await processor.process(testScreenshot, testInstruction);

      expect(result).toEqual([]);
      expect(mockBetaMessagesCreate).not.toHaveBeenCalled();
    });

    it('should return empty array when cache returns undefined', async () => {
      const processor = new ClaudeScreenProcessor(testApiKey);

      const mockMap = new Map<string, ScreenElement[]>();
      jest.spyOn(mockMap, 'has').mockImplementation(() => true);
      jest.spyOn(mockMap, 'get').mockImplementation(() => undefined);

      // Replace the processor's cachedResults with our mock
      processor['cachedResults'] = mockMap;

      // Call process - this should trigger the cache path
      const result = await processor.process(testScreenshot, testInstruction);

      expect(result).toEqual([]);
      expect(mockBetaMessagesCreate).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockBetaMessagesCreate.mockRejectedValueOnce(new Error('API Error'));

      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const processor = new ClaudeScreenProcessor(testApiKey);

      const result = await processor.process(testScreenshot, testInstruction);

      expect(console.error).toHaveBeenCalledWith(
        'Error calling Claude API:',
        expect.any(Error),
      );
      expect(result).toEqual([]);

      console.error = originalConsoleError;
    });

    it('should handle invalid JSON responses', async () => {
      mockBetaMessagesCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'Not valid JSON',
          },
        ],
      });

      const originalConsoleError = console.error;
      console.error = jest.fn();

      const processor = new ClaudeScreenProcessor(testApiKey);

      const result = await processor.process(testScreenshot, testInstruction);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse and validate element information:',
        expect.any(Error),
      );
      expect(result).toEqual([]);

      console.error = originalConsoleError;
    });

    it('should handle responses without text blocks', async () => {
      mockBetaMessagesCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'not_text',
            content: 'Something else',
          },
        ],
      });

      const processor = new ClaudeScreenProcessor(testApiKey);

      const result = await processor.process(testScreenshot, testInstruction);

      expect(result).toEqual([]);
    });

    it('should use the correct beta flag based on tool version', async () => {
      mockBetaMessagesCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockElements),
          },
        ],
      });

      const processor = new ClaudeScreenProcessor(testApiKey);

      // Access and modify the private config for testing
      // @ts-ignore - Accessing private property for testing
      processor.config.toolVersion = '20241022';

      await processor.process(testScreenshot, testInstruction);

      // Verify the correct beta flag was used
      // Using type assertion to avoid unsafe member access
      const mockCalls = mockBetaMessagesCreate.mock?.calls as unknown as Array<
        [MessageCreateParams]
      >;
      const callArgs = mockCalls[0][0];
      expect(callArgs.betas).toContain('computer-use-2024-10-22');
    });
  });
});
