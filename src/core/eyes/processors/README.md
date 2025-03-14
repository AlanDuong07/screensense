# Screen Processors

Screen processors are a key component of the ScreenSense library that analyze screenshots and natural language instructions to identify UI elements and their coordinates. This directory contains built-in screen processors and provides guidance for creating custom ones.

## Built-in Processors

### ClaudeScreenProcessor

The default screen processor uses Anthropic's Claude model with Computer Use capabilities to analyze screenshots and identify UI elements based on natural language instructions.

Key features:
- Uses Claude's vision capabilities to interpret screenshots
- Translates natural language instructions into actionable elements with coordinates
- Includes result caching to improve performance for repeated queries
- Handles API errors gracefully

## Creating Custom Screen Processors

You can create your own custom screen processors to use alternative vision models or implement specialized element detection logic. Here's how:

### 1. Implement the ScreenProcessor Interface

Create a new class that implements the `ScreenProcessor` interface:

```typescript
import { ScreenProcessor } from '../types';
import { ScreenElement } from '../../types';

export class CustomScreenProcessor implements ScreenProcessor {
  /**
   * Process a screenshot and instruction to identify elements
   * 
   * @param screenshot - Base64 encoded string of the screenshot
   * @param instruction - Natural language instruction describing what to look for
   * @returns Promise resolving to an array of elements with coordinates and descriptions
   */
  async process(screenshot: string, instruction: string): Promise<ScreenElement[]> {
    // Your custom implementation here
    // This could use a different vision model, a local ML model,
    // or any other approach to analyze the screenshot
    
    // Example implementation structure:
    try {
      // 1. Preprocess the screenshot if needed
      // 2. Send to your vision model/API
      // 3. Process the results
      // 4. Return formatted elements
      
      return [
        { 
          description: 'Example element', 
          coordinate: [100, 200] 
        },
        // Add more elements as needed
      ];
    } catch (error) {
      console.error('Error in custom screen processor:', error);
      return [];
    }
  }
}
```

### 2. Register Your Custom Processor

Before initializing ScreenSense, register your custom processor with the `ScreenProcessorFactory`:

```typescript
import { ScreenProcessorFactory } from '../screenProcessing';
import { CustomScreenProcessor } from './customScreenProcessor';

// Register with a unique name
ScreenProcessorFactory.registerScreenProcessor(
  'my-custom-processor',
  new CustomScreenProcessor()
);
```

### 3. Use Your Custom Processor

When initializing ScreenSense, specify your custom processor's name in the configuration:

```typescript
import { ScreenSense } from 'screensense';

const screenSense = new ScreenSense({
  // Other config options...
  screenProcessorName: 'my-custom-processor'
});
```

## Processor Selection Logic

The `ScreenProcessorFactory.getScreenProcessor()` method handles processor selection with the following logic:

1. If a `screenProcessorName` is provided and a processor with that name exists in the registry, that processor is returned
2. Otherwise, the default `ClaudeScreenProcessor` is returned

This allows for flexible processor selection while maintaining a reliable fallback.

## Best Practices

When implementing custom screen processors:

1. **Handle errors gracefully** - Always include error handling to prevent crashes
2. **Consider caching** - Implement caching for repeated queries to improve performance
3. **Validate results** - Ensure returned coordinates are valid and within screen boundaries
4. **Provide meaningful descriptions** - Element descriptions should be clear and useful
5. **Document limitations** - Be clear about what types of elements your processor can and cannot detect

## Example: Integration with Other Vision Models

You can integrate with other vision models like OpenAI's GPT-4 Vision:

```typescript
import { ScreenProcessor } from '../types';
import { ScreenElement } from '../../types';
import OpenAI from 'openai';

export class GPT4VisionProcessor implements ScreenProcessor {
  private client: OpenAI;
  
  constructor(apiKey?: string) {
    const resolvedApiKey = apiKey || process.env.OPENAI_API_KEY;
    this.client = new OpenAI({ apiKey: resolvedApiKey });
  }
  
  async process(screenshot: string, instruction: string): Promise<ScreenElement[]> {
    try {
      // Implementation with GPT-4 Vision
      // ...
      
      return elements;
    } catch (error) {
      console.error('Error in GPT-4 Vision processor:', error);
      return [];
    }
  }
}

// Register the processor
ScreenProcessorFactory.registerScreenProcessor(
  'gpt4-vision',
  new GPT4VisionProcessor()
);
```

Remember to register your custom processor before initializing ScreenSense, and specify the processor name in the ScreenSense configuration to use it.
