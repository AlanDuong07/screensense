/**
 * Test suite for the ScreenSense client class
 *
 * These tests verify the functionality of the ScreenSense class, which provides
 * methods for browser automation using Playwright with a focus on coordinate-based
 * interactions rather than DOM selectors.
 */

import { ScreenSense } from '../../src/core/client';
import { Browser, BrowserContext, Page, Keyboard, Mouse } from 'playwright';
import { ScreenProcessor } from '../../src/core/eyes/types';
import { ScreenProcessorFactory } from '../../src/core/eyes/screenProcessing';

describe('ScreenSense', () => {
  // Mock objects
  let mockBrowser: jest.Mocked<Browser>;
  let mockContext: jest.Mocked<BrowserContext>;
  let mockPage: jest.Mocked<Page>;
  let mockKeyboard: jest.Mocked<Keyboard>;
  let mockMouse: jest.Mocked<Mouse>;

  // Test instance
  let screenSense: ScreenSense;

  // Setup mocks before each test
  beforeEach(() => {
    // Create mock objects
    mockKeyboard = {
      down: jest.fn().mockResolvedValue(undefined),
      up: jest.fn().mockResolvedValue(undefined),
      type: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Keyboard>;

    mockMouse = {
      move: jest.fn().mockResolvedValue(undefined),
      down: jest.fn().mockResolvedValue(undefined),
      up: jest.fn().mockResolvedValue(undefined),
      wheel: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Mouse>;

    mockPage = {
      title: jest.fn().mockResolvedValue('Test Page'),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('test-screenshot')),
      keyboard: mockKeyboard,
      mouse: mockMouse,
      bringToFront: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Page>;

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
    } as unknown as jest.Mocked<BrowserContext>;

    mockBrowser = {
      close: jest.fn().mockResolvedValue(undefined),
      newContext: jest.fn().mockResolvedValue(mockContext),
    } as unknown as jest.Mocked<Browser>;

    // Create test instance
    screenSense = new ScreenSense();

    // Mock dynamic import of playwright with named mocks
    jest.mock(
      'playwright',
      () => ({
        chromium: {
          launch: jest.fn().mockResolvedValue(mockBrowser),
          connect: jest.fn().mockResolvedValue(mockBrowser),
          connectOverCDP: jest.fn().mockResolvedValue(mockBrowser),
        },
      }),
      { virtual: true },
    );
  });

  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  /**
   * Browser Lifecycle Tests
   */
  describe('Browser Lifecycle', () => {
    describe('startBrowser', () => {
      it('should start a browser with default settings', async () => {
        // Get the mocked module
        const { chromium } = await import('playwright');

        await screenSense.startBrowser();

        // Verify the browser was launched with default settings
        expect(chromium.launch).toHaveBeenCalled();
        expect(mockBrowser.newContext).toHaveBeenCalled();
        expect(mockContext.newPage).toHaveBeenCalled();
      });

      it('should start a browser with remote WebSocket settings', async () => {
        // Create instance with remote settings
        screenSense = new ScreenSense({
          browserSettings: {
            type: 'remote',
            wssUrl: 'ws://test.url',
          },
        });

        // Get the mocked module
        const { chromium } = await import('playwright');

        await screenSense.startBrowser();

        expect(chromium.connect).toHaveBeenCalledWith({
          wsEndpoint: 'ws://test.url',
        });
        expect(mockBrowser.newContext).toHaveBeenCalled();
      });

      it('should start a browser with remote CDP settings', async () => {
        // Create instance with CDP settings
        screenSense = new ScreenSense({
          browserSettings: {
            type: 'remote',
            cdpUrl: 'http://test.cdp.url',
          },
        });

        // Get the mocked module
        const { chromium } = await import('playwright');

        await screenSense.startBrowser();

        expect(chromium.connectOverCDP).toHaveBeenCalledWith({
          endpointURL: 'http://test.cdp.url',
        });
      });

      it('should start a browser with local settings', async () => {
        // Create instance with local settings
        screenSense = new ScreenSense({
          browserSettings: {
            type: 'local',
            localChromePath: '/path/to/chrome',
            proxy: 'http://proxy.test',
          },
          userAgent: 'Test User Agent',
        });

        // Get the mocked module
        const { chromium } = await import('playwright');

        await screenSense.startBrowser();

        expect(chromium.launch).toHaveBeenCalledWith({
          executablePath: '/path/to/chrome',
          proxy: { server: 'http://proxy.test' },
        });
        expect(mockBrowser.newContext).toHaveBeenCalledWith({
          userAgent: 'Test User Agent',
        });
      });

      it('should handle errors when starting browser', async () => {
        // Mock the dynamic import to throw an error
        jest.doMock('playwright', () => ({
          chromium: {
            launch: jest
              .fn()
              .mockRejectedValue(new Error('Browser launch error')),
          },
        }));

        // Get the mocked module
        await import('playwright');

        await expect(screenSense.startBrowser()).rejects.toThrow(
          'Browser launch error',
        );
      });
    });

    describe('closeBrowser', () => {
      it('should close the browser and clean up resources', async () => {
        await screenSense.startBrowser();
        await screenSense.closeBrowser();

        expect(mockBrowser.close).toHaveBeenCalled();
      });

      it('should handle case when browser is already closed', async () => {
        // Start and close the browser
        await screenSense.startBrowser();
        await screenSense.closeBrowser();

        // Reset the mock to verify it's not called again
        mockBrowser.close.mockClear();

        // Call closeBrowser again when browser is already null
        // This should not throw an error and not try to close again
        await expect(screenSense.closeBrowser()).resolves.not.toThrow();
        expect(mockBrowser.close).not.toHaveBeenCalled();
      });

      it('should handle errors when closing browser', async () => {
        // Mock browser close to throw error
        mockBrowser.close.mockRejectedValueOnce(
          new Error('Browser close error'),
        );

        await screenSense.startBrowser();
        await expect(screenSense.closeBrowser()).rejects.toThrow(
          'Browser close error',
        );
      });
    });
  });

  /**
   * Screenshot Tests
   */
  describe('Screenshot', () => {
    describe('takeScreenshot', () => {
      it('should take a screenshot and return base64 string', async () => {
        await screenSense.startBrowser();
        const screenshot = await screenSense.takeScreenshot();

        expect(mockPage.screenshot).toHaveBeenCalledWith({ type: 'png' });
        expect(screenshot).toBe('test-screenshot');
      });

      it('should throw error when no active page', async () => {
        await expect(screenSense.takeScreenshot()).rejects.toThrow(
          'No active page',
        );
      });

      it('should handle screenshot errors', async () => {
        // Mock screenshot to throw error
        mockPage.screenshot.mockRejectedValueOnce(
          new Error('Screenshot error'),
        );

        await screenSense.startBrowser();
        await expect(screenSense.takeScreenshot()).rejects.toThrow(
          'Screenshot error',
        );
      });

      it('should return base64 string in non-test environment', async () => {
        // Save original NODE_ENV
        const originalNodeEnv = process.env.NODE_ENV;

        try {
          // Set NODE_ENV to 'production' to execute the non-test branch
          process.env.NODE_ENV = 'production';

          // Create a mock buffer with toString method
          const mockBuffer = Buffer.from('test-image-data');
          mockPage.screenshot.mockResolvedValueOnce(mockBuffer);

          await screenSense.startBrowser();
          const screenshot = await screenSense.takeScreenshot();

          // Verify screenshot was taken
          expect(mockPage.screenshot).toHaveBeenCalledWith({ type: 'png' });

          // Verify the base64 conversion was used instead of the test shortcut
          expect(screenshot).toBe(mockBuffer.toString('base64'));
          expect(screenshot).not.toBe('test-screenshot');
        } finally {
          // Restore original NODE_ENV
          process.env.NODE_ENV = originalNodeEnv;
        }
      });
    });
  });

  /**
   * Element Coordinate Tests
   *
   * These tests verify that the getCoordinates method correctly interacts with
   * the ScreenProcessorFactory to process screenshots and extract element coordinates
   * based on natural language instructions.
   */
  describe('Element Coordinates', () => {
    /**
     * Tests for the getCoordinates method which uses the ScreenProcessorFactory
     * to process screenshots and extract element coordinates based on instructions.
     */
    describe('getCoordinates', () => {
      // Create mock objects for our tests
      let mockGetScreenProcessor: jest.SpyInstance;
      let mockProcessor: { process: jest.Mock };

      beforeEach(async () => {
        // Create a mock processor with test data
        mockProcessor = {
          process: jest.fn().mockResolvedValue([
            {
              description: 'Test Button',
              coordinate: [100, 200],
            },
            {
              description: 'Test Link',
              coordinate: [300, 400],
            },
          ]),
        };

        // Mock the ScreenProcessorFactory.getScreenProcessor method
        mockGetScreenProcessor = jest
          .spyOn(ScreenProcessorFactory, 'getScreenProcessor')
          .mockReturnValue(mockProcessor as unknown as ScreenProcessor);

        // Start the browser for this test
        await screenSense.startBrowser();
      });

      afterEach(() => {
        // Restore the original implementation after each test
        mockGetScreenProcessor.mockRestore();
      });

      it('should return element coordinates for a given instruction', async () => {
        const instruction = 'find the login button';

        const elements = await screenSense.getCoordinates(instruction);

        expect(mockPage.screenshot).toHaveBeenCalled();

        // Since we're using default config, processorName should be undefined
        expect(mockGetScreenProcessor).toHaveBeenCalledWith(undefined);

        expect(mockProcessor.process).toHaveBeenCalledWith(
          'test-screenshot',
          instruction,
        );

        expect(elements).toHaveLength(2);
        expect(elements[0]).toEqual({
          description: 'Test Button',
          coordinate: [100, 200],
        });
        expect(elements[1]).toEqual({
          description: 'Test Link',
          coordinate: [300, 400],
        });
      });

      it('should use custom screen processor if specified in config', async () => {
        const customScreenSense = new ScreenSense({
          screenProcessorName: 'customProcessor',
        });

        await customScreenSense.startBrowser();

        const instruction = 'find the signup button';

        await customScreenSense.getCoordinates(instruction);

        expect(mockGetScreenProcessor).toHaveBeenCalledWith('customProcessor');
      });

      it('should throw an error if no active page exists', async () => {
        await screenSense.closeBrowser();

        const instruction = 'find the login button';

        await expect(screenSense.getCoordinates(instruction)).rejects.toThrow(
          'No active page for getting coordinates',
        );

        expect(mockProcessor.process).not.toHaveBeenCalled();
      });

      it('should handle errors from screen processor', async () => {
        mockProcessor.process.mockRejectedValueOnce(
          new Error('Processing failed'),
        );

        const instruction = 'find the login button';

        await expect(screenSense.getCoordinates(instruction)).rejects.toThrow(
          'Processing failed',
        );
      });

      it('should handle empty results from screen processor', async () => {
        mockProcessor.process.mockResolvedValueOnce([]);

        const instruction = 'find a non-existent element';

        const elements = await screenSense.getCoordinates(instruction);

        expect(elements).toEqual([]);
        expect(elements).toHaveLength(0);
      });

      it('should handle errors when taking screenshot', async () => {
        mockPage.screenshot.mockRejectedValueOnce(
          new Error('Screenshot failed'),
        );

        const instruction = 'find the login button';

        await expect(screenSense.getCoordinates(instruction)).rejects.toThrow(
          'Screenshot failed',
        );

        expect(mockProcessor.process).not.toHaveBeenCalled();
      });
    });
  });

  /**
   * Mouse Interaction Tests
   */
  describe('Mouse Interactions', () => {
    beforeEach(async () => {
      await screenSense.startBrowser();
    });

    describe('moveMouse', () => {
      it('should move mouse to specified coordinates', async () => {
        await screenSense.moveMouse([100, 200]);

        expect(mockMouse.move).toHaveBeenCalledWith(100, 200);
      });

      it('should move mouse with modifier keys held', async () => {
        await screenSense.moveMouse([100, 200], ['shift', 'ctrl']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('Shift_L');
        expect(mockKeyboard.down).toHaveBeenCalledWith('Control_L');
        expect(mockMouse.move).toHaveBeenCalledWith(100, 200);
        expect(mockKeyboard.up).toHaveBeenCalledWith('Shift_L');
        expect(mockKeyboard.up).toHaveBeenCalledWith('Control_L');
      });

      it('should throw error when no active page', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        await expect(newScreenSense.moveMouse([100, 200])).rejects.toThrow(
          'No active page',
        );
      });

      it('should handle errors during mouse movement', async () => {
        mockMouse.move.mockRejectedValueOnce(new Error('Mouse move error'));

        await expect(screenSense.moveMouse([100, 200])).rejects.toThrow(
          'Mouse move error',
        );
      });
    });

    describe('clickMouse', () => {
      it('should perform a left click at specified coordinates', async () => {
        await screenSense.clickMouse('left', 'click', [100, 200]);

        expect(mockMouse.move).toHaveBeenCalledWith(100, 200);
        expect(mockMouse.down).toHaveBeenCalledWith({ button: 'left' });
        expect(mockMouse.up).toHaveBeenCalledWith({ button: 'left' });
      });

      it('should perform multiple clicks', async () => {
        await screenSense.clickMouse('left', 'click', [100, 200], 2);

        expect(mockMouse.down).toHaveBeenCalledTimes(2);
        expect(mockMouse.up).toHaveBeenCalledTimes(2);
      });

      it('should perform mouse down action', async () => {
        await screenSense.clickMouse('left', 'down', [100, 200]);

        expect(mockMouse.move).toHaveBeenCalledWith(100, 200);
        expect(mockMouse.down).toHaveBeenCalledWith({ button: 'left' });
      });

      it('should perform mouse up action', async () => {
        await screenSense.clickMouse('left', 'up', [100, 200]);

        expect(mockMouse.move).toHaveBeenCalledWith(100, 200);
        expect(mockMouse.up).toHaveBeenCalledWith({ button: 'left' });
      });

      it('should click with modifier keys held', async () => {
        await screenSense.clickMouse('left', 'click', [100, 200], 1, ['shift']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('Shift_L');
        expect(mockMouse.down).toHaveBeenCalledWith({ button: 'left' });
        expect(mockMouse.up).toHaveBeenCalledWith({ button: 'left' });
        expect(mockKeyboard.up).toHaveBeenCalledWith('Shift_L');
      });

      it('should throw error when no active page', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        await expect(newScreenSense.clickMouse('left')).rejects.toThrow(
          'No active page',
        );
      });

      it('should handle errors during mouse click', async () => {
        mockMouse.down.mockRejectedValueOnce(new Error('Mouse click error'));

        await expect(
          screenSense.clickMouse('left', 'click', [100, 200]),
        ).rejects.toThrow('Mouse click error');
      });
    });

    describe('dragMouse', () => {
      it('should perform a drag action along specified path', async () => {
        const path: [number, number][] = [
          [100, 100],
          [200, 200],
          [300, 300],
        ];

        await screenSense.dragMouse(path);

        expect(mockMouse.move).toHaveBeenCalledWith(100, 100);
        expect(mockMouse.down).toHaveBeenCalled();
        expect(mockMouse.move).toHaveBeenCalledWith(200, 200);
        expect(mockMouse.move).toHaveBeenCalledWith(300, 300);
        expect(mockMouse.up).toHaveBeenCalled();
      });

      it('should drag with modifier keys held', async () => {
        const path: [number, number][] = [
          [100, 100],
          [200, 200],
        ];

        await screenSense.dragMouse(path, ['shift']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('Shift_L');
        expect(mockMouse.down).toHaveBeenCalled();
        expect(mockMouse.up).toHaveBeenCalled();
        expect(mockKeyboard.up).toHaveBeenCalledWith('Shift_L');
      });

      it('should throw error for path with less than two points', async () => {
        const path: [number, number][] = [[100, 100]];

        await expect(screenSense.dragMouse(path)).rejects.toThrow(
          'Drag path must contain at least two points',
        );
      });

      it('should throw error when no active page', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();
        const path: [number, number][] = [
          [100, 100],
          [200, 200],
        ];

        await expect(newScreenSense.dragMouse(path)).rejects.toThrow(
          'No active page',
        );
      });

      it('should handle errors during drag', async () => {
        mockMouse.down.mockRejectedValueOnce(new Error('Mouse drag error'));

        const path: [number, number][] = [
          [100, 100],
          [200, 200],
        ];

        await expect(screenSense.dragMouse(path)).rejects.toThrow(
          'Mouse drag error',
        );
      });
    });

    describe('scroll', () => {
      it('should perform a scroll action at specified coordinates', async () => {
        await screenSense.scroll([100, 200], 0, 500);

        expect(mockMouse.move).toHaveBeenCalledWith(100, 200);
        expect(mockMouse.wheel).toHaveBeenCalledWith(0, 500);
      });

      it('should scroll with modifier keys held', async () => {
        await screenSense.scroll([100, 200], 0, 500, ['shift']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('Shift_L');
        expect(mockMouse.wheel).toHaveBeenCalledWith(0, 500);
        expect(mockKeyboard.up).toHaveBeenCalledWith('Shift_L');
      });

      it('should throw error when no active page', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        await expect(newScreenSense.scroll([100, 200])).rejects.toThrow(
          'No active page',
        );
      });

      it('should handle errors during scroll', async () => {
        mockMouse.wheel.mockRejectedValueOnce(new Error('Scroll error'));

        await expect(screenSense.scroll([100, 200], 0, 500)).rejects.toThrow(
          'Scroll error',
        );
      });
    });
  });

  /**
   * Keyboard Interaction Tests
   */
  describe('Keyboard Interactions', () => {
    beforeEach(async () => {
      await screenSense.startBrowser();
    });

    describe('pressKey', () => {
      it('should press specified keys', async () => {
        await screenSense.pressKey(['a', 'b', 'c']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('a');
        expect(mockKeyboard.down).toHaveBeenCalledWith('b');
        expect(mockKeyboard.down).toHaveBeenCalledWith('c');
        expect(mockKeyboard.up).toHaveBeenCalledWith('c');
        expect(mockKeyboard.up).toHaveBeenCalledWith('b');
        expect(mockKeyboard.up).toHaveBeenCalledWith('a');
      });

      it('should normalize special keys', async () => {
        await screenSense.pressKey(['shift', 'ctrl', 'enter']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('Shift_L');
        expect(mockKeyboard.down).toHaveBeenCalledWith('Control_L');
        expect(mockKeyboard.down).toHaveBeenCalledWith('Return');
      });

      it('should hold keys for specified duration', async () => {
        jest.useFakeTimers();

        jest.setTimeout(10000);

        mockKeyboard.down.mockClear();
        mockKeyboard.up.mockClear();

        // Create a promise that will resolve when the key is released
        const promise = screenSense.pressKey(['a'], 1);

        // Verify key down was called immediately
        expect(mockKeyboard.down).toHaveBeenCalledWith('a');
        expect(mockKeyboard.down).toHaveBeenCalledTimes(1);

        expect(mockKeyboard.up).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);
        await Promise.resolve();

        // Verify key is still down (up hasn't been called)
        expect(mockKeyboard.up).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);
        await Promise.resolve();

        await promise;

        // Verify key up was called exactly once with the correct key
        expect(mockKeyboard.up).toHaveBeenCalledTimes(1);
        expect(mockKeyboard.up).toHaveBeenCalledWith('a');

        jest.useRealTimers();
      });

      it('should throw error when no active page', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        await expect(newScreenSense.pressKey(['a'])).rejects.toThrow(
          'No active page',
        );
      });

      it('should use wait method in non-test environment', async () => {
        // Save original NODE_ENV
        const originalNodeEnv = process.env.NODE_ENV;

        try {
          // Set NODE_ENV to 'production' to execute the else branch
          process.env.NODE_ENV = 'production';

          const waitSpy = jest
            .spyOn(screenSense, 'wait')
            .mockResolvedValue(undefined);

          await screenSense.pressKey(['a'], 1);

          expect(waitSpy).toHaveBeenCalledWith(1);
        } finally {
          process.env.NODE_ENV = originalNodeEnv;
        }
      });

      it('should handle errors during key press', async () => {
        mockKeyboard.down.mockRejectedValueOnce(new Error('Key press error'));

        await expect(screenSense.pressKey(['a'])).rejects.toThrow(
          'Key press error',
        );
      });
    });

    describe('typeText', () => {
      it('should type specified text', async () => {
        await screenSense.typeText('Hello world');

        expect(mockKeyboard.type).toHaveBeenCalledWith('Hello world');
      });

      it('should type with modifier keys held', async () => {
        await screenSense.typeText('Hello', ['shift']);

        expect(mockKeyboard.down).toHaveBeenCalledWith('Shift_L');
        expect(mockKeyboard.type).toHaveBeenCalledWith('Hello');
        expect(mockKeyboard.up).toHaveBeenCalledWith('Shift_L');
      });

      it('should throw error when no active page', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        await expect(newScreenSense.typeText('Hello')).rejects.toThrow(
          'No active page',
        );
      });

      it('should handle errors during typing', async () => {
        mockKeyboard.type.mockRejectedValueOnce(new Error('Type error'));

        await expect(screenSense.typeText('Hello')).rejects.toThrow(
          'Type error',
        );
      });
    });
  });

  /**
   * Utility Method Tests
   */
  describe('Utility Methods', () => {
    describe('wait', () => {
      it('should wait for specified duration', async () => {
        jest.useFakeTimers();

        const promise = screenSense.wait(2);

        jest.advanceTimersByTime(2000);

        await promise;

        jest.useRealTimers();
      });
    });
  });

  /**
   * Tab Management Tests
   */
  describe('Tab Management', () => {
    beforeEach(async () => {
      await screenSense.startBrowser();
    });

    describe('getTabs', () => {
      it('should return list of all tabs', async () => {
        // Open additional tab
        await screenSense.openNewTab('https://example.com');

        const tabs = screenSense.getTabs();

        expect(tabs).toHaveLength(2);
        expect(tabs[0].title).toBe('Test Page');
      });

      it('should return empty array when no tabs are open', () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        const tabs = newScreenSense.getTabs();

        expect(tabs).toHaveLength(0);
      });
    });

    describe('openNewTab', () => {
      it('should open a new tab with URL', async () => {
        const tab = await screenSense.openNewTab('https://example.com');

        expect(mockContext.newPage).toHaveBeenCalled();
        expect(tab.title).toBe('Test Page');
      });

      it('should open a new tab with specified URL', async () => {
        const tab = await screenSense.openNewTab('https://example.com');

        expect(mockPage.goto).toHaveBeenCalledWith('https://example.com');
        expect(tab.title).toBe('Test Page');
      });

      it('should throw error when no browser context', async () => {
        // Create new instance without starting browser
        const newScreenSense = new ScreenSense();

        await expect(
          newScreenSense.openNewTab('https://example.com'),
        ).rejects.toThrow('No browser context');
      });

      it('should handle errors when opening new tab', async () => {
        mockContext.newPage.mockRejectedValueOnce(new Error('New tab error'));

        await expect(
          screenSense.openNewTab('https://example.com'),
        ).rejects.toThrow('New tab error');
      });
    });

    describe('switchTab', () => {
      it('should switch to another tab by ID', async () => {
        const newTab = await screenSense.openNewTab('https://example.com');
        const tabId = newTab.id;

        // Open another tab to make the first one inactive
        await screenSense.openNewTab('https://another-example.com');

        const switchedTab = await screenSense.switchTab(tabId);

        expect(switchedTab.id).toBe(tabId);
        expect(mockPage.bringToFront).toHaveBeenCalled();
      });

      it('should throw error when tab with ID not found', async () => {
        await expect(screenSense.switchTab(999)).rejects.toThrow(
          'Tab with ID 999 not found',
        );
      });
    });
  });
});
