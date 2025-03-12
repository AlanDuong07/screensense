/**
 * Core type definitions
 *
 * This file contains the core type definitions used throughout the library.
 * These types establish the foundation for the API and ensure type safety.
 */
import { Page } from 'playwright';

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
  /** WebSocket Secure URL for browser connection */
  wssUrl?: string;
  /** Chrome DevTools Protocol URL */
  cdpUrl?: string;
}

/**
 * Configuration for local browser settings
 */
export interface LocalBrowserSettings {
  /** Path to local Chrome executable */
  localChromePath?: string;
  /** User agent string to use */
  userAgent?: string;
  /** Proxy configuration */
  proxy?: string;
}

/**
 * Configuration options for ScreenSense
 */
export interface ScreenSenseConfig {
  /** Remote browser connection settings */
  remoteBrowserSettings?: RemoteBrowserSettings;
  /** Local browser connection settings */
  localBrowserSettings?: LocalBrowserSettings;
}

/**
 * Element interface for coordinate-based interactions
 */
export interface Element {
  /** Description of the element */
  description: string;
  /** X,Y coordinates of the element */
  coordinate: [number, number];
}

/**
 * Type for mouse button options supported by Playwright
 */
export type MouseButton = 'left' | 'right' | 'middle';

/**
 * Type for mouse click actions
 */
export type ClickType = 'down' | 'up' | 'click';
