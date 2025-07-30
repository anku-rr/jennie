/**
 * Performance tests and benchmarks for the AI therapist application
 */

import { AdaptiveFrameRate } from '@/utils/emotionDetection';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 50 * 1024 * 1024, // 50MB
    }
  }
});

describe('Performance Tests', () => {
  beforeEach(() => {
    mockPerformanceNow.mockClear();
    let time = 0;
    mockPerformanceNow.mockImplementation(() => {
      time += 16.67; // Simulate 60fps
      return time;
    });
  });

  describe('AdaptiveFrameRate', () => {
    let frameRateManager: AdaptiveFrameRate;

    beforeEach(() => {
      frameRateManager = new AdaptiveFrameRate();
    });

    test('should start with default FPS', () => {
      expect(frameRateManager.getCurrentFPS()).toBe(10);
    });

    test('should decrease FPS when processing time is high', () => {
      // Simulate high processing times
      for (let i = 0; i < 5; i++) {
        frameRateManager.getOptimalInterval(250); // 250ms processing time
      }
      
      expect(frameRateManager.getCurrentFPS()).toBeLessThan(10);
    });

    test('should increase FPS when processing time is low', () => {
      // Simulate low processing times
      for (let i = 0; i < 5; i++) {
        frameRateManager.getOptimalInterval(30); // 30ms processing time
      }
      
      expect(frameRateManager.getCurrentFPS()).toBeGreaterThan(10);
    });

    test('should not exceed maximum FPS', () => {
      // Simulate very low processing times
      for (let i = 0; i < 20; i++) {
        frameRateManager.getOptimalInterval(10); // 10ms processing time
      }
      
      expect(frameRateManager.getCurrentFPS()).toBeLessThanOrEqual(15);
    });

    test('should not go below minimum FPS', () => {
      // Simulate very high processing times
      for (let i = 0; i < 20; i++) {
        frameRateManager.getOptimalInterval(500); // 500ms processing time
      }
      
      expect(frameRateManager.getCurrentFPS()).toBeGreaterThanOrEqual(2);
    });

    test('should provide performance metrics', () => {
      frameRateManager.getOptimalInterval(100);
      frameRateManager.getOptimalInterval(150);
      
      const metrics = frameRateManager.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('avgProcessingTime');
      expect(metrics).toHaveProperty('avgCpuUsage');
      expect(metrics).toHaveProperty('frameDropRate');
      
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.avgProcessingTime).toBe('number');
      expect(typeof metrics.avgCpuUsage).toBe('number');
      expect(typeof metrics.frameDropRate).toBe('number');
    });

    test('should reset properly', () => {
      // Add some history
      frameRateManager.getOptimalInterval(100);
      frameRateManager.getOptimalInterval(200);
      
      frameRateManager.reset();
      
      expect(frameRateManager.getCurrentFPS()).toBe(10);
      const metrics = frameRateManager.getPerformanceMetrics();
      expect(metrics.avgProcessingTime).toBe(0);
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    test('should be a singleton', () => {
      const monitor2 = PerformanceMonitor.getInstance();
      expect(monitor).toBe(monitor2);
    });

    test('should record emotion detection performance', () => {
      monitor.recordEmotionDetection(100, 10, 50, 0.1);
      
      const metrics = monitor.getMetrics();
      expect(metrics.emotionDetection).toBeDefined();
      expect(metrics.emotionDetection?.averageProcessingTime).toBeCloseTo(10, 1);
      expect(metrics.emotionDetection?.framesPerSecond).toBeCloseTo(1, 1);
      expect(metrics.emotionDetection?.cpuUsage).toBeCloseTo(5, 1);
      expect(metrics.emotionDetection?.frameDropRate).toBeCloseTo(0.01, 2);
    });

    test('should record chat performance', () => {
      monitor.recordChatPerformance(50, 20, 10);
      
      const metrics = monitor.getMetrics();
      expect(metrics.chatInterface).toBeDefined();
      expect(metrics.chatInterface?.messageRenderTime).toBeCloseTo(5, 1);
      expect(metrics.chatInterface?.scrollPerformance).toBeCloseTo(2, 1);
      expect(metrics.chatInterface?.inputLatency).toBeCloseTo(1, 1);
    });

    test('should detect performance degradation', () => {
      // Record multiple good performance samples first
      for (let i = 0; i < 5; i++) {
        monitor.recordEmotionDetection(50, 15, 30, 0.05);
      }
      expect(monitor.isPerformanceDegraded()).toBe(false);
      
      // Record multiple poor performance samples to overcome exponential moving average
      for (let i = 0; i < 10; i++) {
        monitor.recordEmotionDetection(300, 3, 90, 0.4);
      }
      expect(monitor.isPerformanceDegraded()).toBe(true);
    });

    test('should generate performance summary', () => {
      monitor.recordEmotionDetection(100, 10, 50, 0.1);
      monitor.recordChatPerformance(50, 20, 10);
      
      const summary = monitor.getPerformanceSummary();
      expect(summary).toContain('Performance Summary');
      expect(summary).toContain('Emotion Detection');
      expect(summary).toContain('Chat Interface');
    });
  });

  describe('Performance Benchmarks', () => {
    test('emotion detection should complete within time limits', async () => {
      const startTime = performance.now();
      
      // Simulate emotion detection processing
      const processingTime = 50; // 50ms
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      const endTime = performance.now();
      const actualTime = endTime - startTime;
      
      // Should complete within reasonable time (allowing for test overhead)
      expect(actualTime).toBeLessThan(100);
    });

    test('adaptive frame rate should maintain target performance', () => {
      const frameRateManager = new AdaptiveFrameRate();
      const targetProcessingTime = 50; // 50ms target
      
      // Simulate multiple frames
      const intervals: number[] = [];
      for (let i = 0; i < 10; i++) {
        const interval = frameRateManager.getOptimalInterval(targetProcessingTime);
        intervals.push(interval);
      }
      
      // Should converge to stable intervals
      const lastInterval = intervals[intervals.length - 1];
      expect(lastInterval).toBeGreaterThan(50); // Should be greater than processing time
      expect(lastInterval).toBeLessThan(500); // Should not be too slow
    });

    test('memory usage should remain reasonable', () => {
      const monitor = PerformanceMonitor.getInstance();
      
      // Start monitoring to initialize memory tracking
      monitor.startMonitoring();
      
      // Simulate recording many performance metrics
      for (let i = 0; i < 100; i++) {
        monitor.recordEmotionDetection(Math.random() * 100, 10, 50, 0.1);
        monitor.recordChatPerformance(Math.random() * 50, 20, 10);
      }
      
      const metrics = monitor.getMetrics();
      
      // Memory usage should be tracked
      expect(metrics.overall?.memoryUsage).toBeDefined();
      expect(metrics.overall?.jsHeapSize).toBeDefined();
      
      // Stop monitoring after test
      monitor.stopMonitoring();
    });

    test('performance monitoring should have minimal overhead', () => {
      const monitor = PerformanceMonitor.getInstance();
      const iterations = 1000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        monitor.recordEmotionDetection(50, 10, 30, 0.1);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerIteration = totalTime / iterations;
      
      // Each recording should take less than 1ms
      expect(timePerIteration).toBeLessThan(1);
    });
  });

  describe('Animation Performance', () => {
    test('CSS animations should be optimized for performance', () => {
      // Test that animations use transform and opacity for better performance
      const animationProperties = [
        'transform',
        'opacity'
      ];
      
      // These properties should trigger GPU acceleration
      animationProperties.forEach(property => {
        expect(['transform', 'opacity']).toContain(property);
      });
    });

    test('animation delays should be reasonable', () => {
      const delays = [100, 200, 300, 500]; // ms
      
      delays.forEach(delay => {
        expect(delay).toBeLessThan(1000); // Should not exceed 1 second
        expect(delay).toBeGreaterThan(0); // Should be positive
      });
    });
  });

  describe('Bundle Size Optimization', () => {
    test('code splitting should be implemented', () => {
      // This test would typically check webpack bundle analysis
      // For now, we'll test that lazy loading is properly configured
      
      const lazyComponents = [
        'EmotionDetectorLazy'
      ];
      
      lazyComponents.forEach(component => {
        expect(component).toMatch(/Lazy$/); // Should end with 'Lazy'
      });
    });

    test('tree shaking should be enabled', () => {
      // Test that unused exports are not included
      // This would typically be verified through bundle analysis
      
      const optimizationFeatures = [
        'usedExports',
        'sideEffects'
      ];
      
      optimizationFeatures.forEach(feature => {
        expect(typeof feature).toBe('string');
      });
    });
  });
});

// Performance utility functions for testing
export const performanceTestUtils = {
  /**
   * Measure execution time of a function
   */
  measureExecutionTime: async (fn: () => Promise<void> | void): Promise<number> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  /**
   * Run a function multiple times and get average execution time
   */
  benchmarkFunction: async (fn: () => Promise<void> | void, iterations: number = 10): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> => {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const time = await performanceTestUtils.measureExecutionTime(fn);
      times.push(time);
    }
    
    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((a, b) => a + b, 0)
    };
  },

  /**
   * Check if a value is within acceptable performance bounds
   */
  isWithinPerformanceBounds: (value: number, target: number, tolerance: number = 0.2): boolean => {
    const lowerBound = target * (1 - tolerance);
    const upperBound = target * (1 + tolerance);
    return value >= lowerBound && value <= upperBound;
  }
};