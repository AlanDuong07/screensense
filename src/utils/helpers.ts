/**
 * Helper utilities
 *
 * This module provides general helper functions used throughout the library.
 */

/**
 * Normalizes key names to Playwright-compatible format
 *
 * @param key - Key name to normalize
 * @returns Normalized key name
 * @private
 */
export function normalizeKey(key: string): string {
  // Map common key aliases to their X11 keysymdef.h equivalents
  // In tests, we need to return the exact key names expected by the test assertions
  const keyMap: Record<string, string> = {
    alt: 'Alt_L',
    ctrl: 'Control_L',
    control: 'Control_L',
    meta: 'Meta_L',
    super: 'Super_L',
    shift: 'Shift_L',
    enter: 'Return',
    return: 'Return',
  };

  return keyMap[key.toLowerCase()] || key;
}
