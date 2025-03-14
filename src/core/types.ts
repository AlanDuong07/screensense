/**
 * Core type definitions
 *
 * This file contains the core type definitions used throughout the library.
 * These types establish the foundation for the API and ensure type safety.
 */
import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Tab interface representing a browser tab
 */
export interface Tab {
  /** Unique identifier for the tab */
  id: number;
  /** Playwright Page object */
  page: Page;
  /** Title of the tab */
  title: string;
}

/**
 * Configuration for remote browser settings
 */
export interface RemoteBrowserSettings {
  type: 'remote';
  /** WebSocket Secure URL for browser connection */
  wssUrl?: string;
  /** Chrome DevTools Protocol URL */
  cdpUrl?: string;
}

/**
 * Configuration for local browser settings
 */
export interface LocalBrowserSettings {
  type: 'local';
  /** Path to local Chrome executable */
  localChromePath?: string;
  /** Proxy configuration */
  proxy?: string;
}

/**
 * Configuration options for ScreenSense
 */
export interface ScreenSenseConfig {
  /** Browser settings, either remote or local */
  browserSettings?: RemoteBrowserSettings | LocalBrowserSettings;
  /** User agent string to add to every browser context */
  userAgent?: string;
  /** Name of the specific screen processor to use for element detection. See src/core/eyes/processors/README.md for more information. */
  screenProcessorName?: string;
}

/**
 * Schema for validating element information returned by screen processors
 */
export const ScreenElementSchema = z.object({
  description: z.string(),
  coordinate: z.tuple([z.number(), z.number()]),
});

/**
 * Type for an element on the screen
 */
export type ScreenElement = z.infer<typeof ScreenElementSchema>;

/**
 * Type for mouse button options supported by Playwright
 */
export type MouseButton = 'left' | 'right' | 'middle';

/**
 * Type for mouse click actions
 */
export type ClickType = 'down' | 'up' | 'click';
