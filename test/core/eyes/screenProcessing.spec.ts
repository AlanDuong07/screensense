/**
 * Tests for the ScreenProcessorFactory which manages registration and retrieval of screen processors
 */

import { ScreenProcessorFactory } from '../../../src/core/eyes/screenProcessing';
import { ClaudeScreenProcessor } from '../../../src/core/eyes/processors/claudeScreenProcessor';
import { ScreenProcessor } from '../../../src/core/eyes/types';

jest.mock('../../../src/core/eyes/processors/claudeScreenProcessor', () => {
  return {
    ClaudeScreenProcessor: jest.fn().mockImplementation(() => {
      return {
        process: jest.fn().mockResolvedValue([]),
      };
    }),
  };
});

describe('ScreenProcessorFactory', () => {
  beforeEach(() => {
    // Access the private registry and reset it
    // @ts-ignore - Accessing private property for testing
    ScreenProcessorFactory.registry = {};
  });

  describe('registerScreenProcessor', () => {
    it('should register a custom screen processor', () => {
      const mockProcessor: ScreenProcessor = {
        process: jest.fn(),
      };

      ScreenProcessorFactory.registerScreenProcessor('custom', mockProcessor);

      // Verify the processor was registered
      // @ts-ignore - Accessing private property for testing
      expect(ScreenProcessorFactory.registry['custom']).toBe(mockProcessor);
    });

    it('should override an existing processor with the same name', () => {
      const mockProcessor1: ScreenProcessor = {
        process: jest.fn(),
      };
      const mockProcessor2: ScreenProcessor = {
        process: jest.fn(),
      };

      ScreenProcessorFactory.registerScreenProcessor('custom', mockProcessor1);
      ScreenProcessorFactory.registerScreenProcessor('custom', mockProcessor2);

      // Verify the second processor replaced the first
      // @ts-ignore - Accessing private property for testing
      expect(ScreenProcessorFactory.registry['custom']).toBe(mockProcessor2);
      // @ts-ignore - Accessing private property for testing
      expect(ScreenProcessorFactory.registry['custom']).not.toBe(
        mockProcessor1,
      );
    });

    it('should allow registering multiple processors with different names', () => {
      const mockProcessor1: ScreenProcessor = {
        process: jest.fn(),
      };
      const mockProcessor2: ScreenProcessor = {
        process: jest.fn(),
      };

      // Register both processors with different names
      ScreenProcessorFactory.registerScreenProcessor('custom1', mockProcessor1);
      ScreenProcessorFactory.registerScreenProcessor('custom2', mockProcessor2);

      // Verify both processors were registered correctly
      // @ts-ignore - Accessing private property for testing
      expect(ScreenProcessorFactory.registry['custom1']).toBe(mockProcessor1);
      // @ts-ignore - Accessing private property for testing
      expect(ScreenProcessorFactory.registry['custom2']).toBe(mockProcessor2);
    });
  });

  describe('getScreenProcessor', () => {
    it('should return the default ClaudeScreenProcessor when no name is provided', () => {
      const processor = ScreenProcessorFactory.getScreenProcessor();

      expect(ClaudeScreenProcessor).toHaveBeenCalled();
      expect(processor).toBeDefined();
      expect(processor.process).toBeDefined();
    });

    it('should return the default ClaudeScreenProcessor when an unknown name is provided', () => {
      const processor = ScreenProcessorFactory.getScreenProcessor('unknown');

      expect(ClaudeScreenProcessor).toHaveBeenCalled();
      expect(processor).toBeDefined();
      expect(processor.process).toBeDefined();
    });

    it('should return the registered processor when a valid name is provided', () => {
      const mockProcessor: ScreenProcessor = {
        process: jest.fn(),
      };

      ScreenProcessorFactory.registerScreenProcessor('custom', mockProcessor);

      const processor = ScreenProcessorFactory.getScreenProcessor('custom');

      expect(processor).toBe(mockProcessor);
    });

    it('should return different processors for different names', () => {
      const mockProcessor1: ScreenProcessor = {
        process: jest.fn(),
      };
      const mockProcessor2: ScreenProcessor = {
        process: jest.fn(),
      };

      ScreenProcessorFactory.registerScreenProcessor('custom1', mockProcessor1);
      ScreenProcessorFactory.registerScreenProcessor('custom2', mockProcessor2);

      const processor1 = ScreenProcessorFactory.getScreenProcessor('custom1');
      const processor2 = ScreenProcessorFactory.getScreenProcessor('custom2');

      expect(processor1).toBe(mockProcessor1);
      expect(processor2).toBe(mockProcessor2);
      expect(processor1).not.toBe(processor2);
    });

    it('should handle case-sensitive processor names', () => {
      const mockProcessor1: ScreenProcessor = {
        process: jest.fn(),
      };
      const mockProcessor2: ScreenProcessor = {
        process: jest.fn(),
      };

      ScreenProcessorFactory.registerScreenProcessor('Custom', mockProcessor1);
      ScreenProcessorFactory.registerScreenProcessor('custom', mockProcessor2);

      const processor1 = ScreenProcessorFactory.getScreenProcessor('Custom');
      const processor2 = ScreenProcessorFactory.getScreenProcessor('custom');

      expect(processor1).toBe(mockProcessor1);
      expect(processor2).toBe(mockProcessor2);
      expect(processor1).not.toBe(processor2);
    });
  });
});
