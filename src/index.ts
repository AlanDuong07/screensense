/**
 * ScreenSense - A TypeScript library for creating modular, vision-only web agents
 *
 * This is the main entry point for the library. It re-exports all public APIs
 * from the various modules to provide a clean, unified interface.
 */

// Re-export from modules
export * from './core';

// Export specific types
export type {
  Tab,
  RemoteBrowserSettings,
  LocalBrowserSettings,
  ScreenSenseConfig,
  Element,
  MouseButton,
  ClickType,
} from './core/types';
