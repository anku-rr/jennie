import { AdaptiveFrameRate, EmotionDetectionError } from './emotionDetection';

describe('AdaptiveFrameRate', () => {
  let frameRateManager: AdaptiveFrameRate;

  beforeEach(() => {
    frameRateManager = new AdaptiveFrameRate();
  });

  it('should start with default FPS', () => {
    expect(frameRateManager.getCurrentFPS()).toBe(10);
  });

  it('should decrease FPS when processing is slow', () => {
    // Simulate slow processing times
    for (let i = 0; i < 5; i++) {
      frameRateManager.getOptimalInterval(250); // 250ms processing time
    }

    expect(frameRateManager.getCurrentFPS()).toBeLessThan(10);
  });

  it('should increase FPS when processing is fast', () => {
    // Simulate fast processing times
    for (let i = 0; i < 5; i++) {
      frameRateManager.getOptimalInterval(30); // 30ms processing time
    }

    expect(frameRateManager.getCurrentFPS()).toBeGreaterThan(10);
  });

  it('should respect min and max FPS limits', () => {
    // Test minimum FPS limit
    for (let i = 0; i < 20; i++) {
      frameRateManager.getOptimalInterval(500); // Very slow processing
    }
    expect(frameRateManager.getCurrentFPS()).toBeGreaterThanOrEqual(2);

    // Reset and test maximum FPS limit
    frameRateManager.reset();
    for (let i = 0; i < 20; i++) {
      frameRateManager.getOptimalInterval(10); // Very fast processing
    }
    expect(frameRateManager.getCurrentFPS()).toBeLessThanOrEqual(15);
  });

  it('should reset to default values', () => {
    // Change FPS
    frameRateManager.getOptimalInterval(300);
    
    // Reset
    frameRateManager.reset();
    
    expect(frameRateManager.getCurrentFPS()).toBe(10);
  });

  it('should return correct interval in milliseconds', () => {
    const interval = frameRateManager.getOptimalInterval(50);
    const expectedInterval = 1000 / frameRateManager.getCurrentFPS();
    
    expect(interval).toBe(expectedInterval);
  });
});

describe('EmotionDetectionError', () => {
  it('should create error with correct properties', () => {
    const error = new EmotionDetectionError('Test error', 'model_load_failed');
    
    expect(error.message).toBe('Test error');
    expect(error.type).toBe('model_load_failed');
    expect(error.name).toBe('EmotionDetectionError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should support all error types', () => {
    const errorTypes = ['model_load_failed', 'detection_failed', 'no_face_detected', 'processing_error'] as const;
    
    errorTypes.forEach(type => {
      const error = new EmotionDetectionError('Test', type);
      expect(error.type).toBe(type);
    });
  });
});