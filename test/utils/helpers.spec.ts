import { normalizeKey } from '../../src/utils/helpers';

/**
 * Test suite for utility helper functions
 */
describe('Helpers', () => {
  describe('normalizeKey', () => {
    /**
     * Tests that common key aliases are properly normalized to their
     * X11 keysymdef.h equivalents
     */
    it('should normalize common key aliases', () => {
      expect(normalizeKey('shift')).toBe('Shift_L');
      expect(normalizeKey('ctrl')).toBe('Control_L');
      expect(normalizeKey('control')).toBe('Control_L');
      expect(normalizeKey('alt')).toBe('Alt_L');
      expect(normalizeKey('meta')).toBe('Meta_L');
      expect(normalizeKey('enter')).toBe('Return');
      expect(normalizeKey('return')).toBe('Return');
    });

    /**
     * Tests that keys without specific mappings are returned unchanged
     */
    it('should return original key if no mapping exists', () => {
      expect(normalizeKey('a')).toBe('a');
      expect(normalizeKey('b')).toBe('b');
      expect(normalizeKey('Escape')).toBe('Escape');
    });
  });
});
