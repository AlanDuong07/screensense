import { ScreenSense } from '../src';

/**
 * Basic test suite for the ScreenSense library
 *
 * This suite tests that the main export is available and properly instantiable.
 * More detailed tests are available in the core/client.spec.ts file.
 */
describe('ScreenSense', () => {
  it('should be properly exported and instantiable', () => {
    expect(ScreenSense).toBeDefined();

    // Check that we can create an instance
    const screenSense = new ScreenSense();
    expect(screenSense).toBeInstanceOf(ScreenSense);
  });
});
