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
