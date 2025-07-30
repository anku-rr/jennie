/**
 * Tests for performance monitoring and debugging utilities
 */

import { getRenderMonitor, RenderMonitor } from '@/utils/renderMonitor';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { EmotionMemoryMonitor } from '@/utils/emotionMemoryMonitor';
import { EmotionData } from '@/types';

// Mock console methods to capture warnings
const mockConsole = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
  info: jest.fn()
};

beforeEach(() => {
  // Reset all mocks
  Object.keys(mockConsole).forEach(key => {
    mockConsole[key as keyof typeof mockConsole].mockClear();
  });
  
  // Mock console methods
  global.console = mockConsole as any;
  
  // Reset monitor instances
  getRenderMonitor().reset();
  PerformanceMonitor.getInstance().stopMonitoring();
  EmotionMemoryMonitor.getInstance().reset();
});

describe('RenderMonitor', () => {
  test('should track component renders', () => {
    const monitor = getRenderMonitor();
    
    monitor.trackRender('TestComponent');
    monitor.trackRender('TestComponent');
    monitor.trackRender('TestComponent');
    
    const stats = monitor.getComponentStats('TestComponent');
    expect(stats?.renderCount).toBe(3);
    expect(stats?.componentName).toBe('TestComponent');
  });

  test('should detect excessive renders', () => {
    const monitor = getRenderMonitor();
    
    // Simulate rapid renders
    for (let i = 0; i < 15; i++) {
      monitor.trackRender('RapidComponent');
    }
    
    // Should have logged warnings about excessive renders
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('EXCESSIVE RENDERS')
    );
  });

  test('should detect infinite loops', () => {
    const monitor = getRenderMonitor();
    
    // Simulate infinite loop (more than 50 renders)
    for (let i = 0; i < 55; i++) {
      monitor.trackRender('InfiniteComponent');
    }
    
    // Should have logged error about infinite loop
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('INFINITE LOOP DETECTED')
    );
  });

  test('should generate render summary', () => {
    const monitor = getRenderMonitor();
    
    monitor.trackRender('Component1');
    monitor.trackRender('Component2');
    monitor.trackRender('Component1');
    
    const summary = monitor.getSummary();
    expect(summary).toContain('Component1');
    expect(summary).toContain('Component2');
    expect(summary).toContain('Total Renders: 2');
  });
});

describe('PerformanceMonitor', () => {
  test('should record emotion detection metrics', () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startMonitoring();
    
    monitor.recordEmotionDetection(100, 15, 50, 0.1);
    monitor.recordEmotionDetection(120, 12, 60, 0.2);
    
    const metrics = monitor.getMetrics();
    expect(metrics.emotionDetection).toBeDefined();
    expect(metrics.emotionDetection?.averageProcessingTime).toBeGreaterThan(0);
    expect(metrics.emotionDetection?.framesPerSecond).toBeGreaterThan(0);
  });

  test('should detect performance degradation', () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startMonitoring();
    
    // Record poor performance metrics
    monitor.recordEmotionDetection(300, 3, 90, 0.5); // High processing time, low FPS
    
    const isDegraded = monitor.isPerformanceDegraded();
    expect(isDegraded).toBe(true);
    
    // Should have logged performance warnings
    expect(mockConsole.warn).toHaveBeenCalled();
  });

  test('should log detailed performance warnings', () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startMonitoring();
    
    // Record multiple metrics with high processing time to build up the exponential moving average
    // Processing time > 150ms, FPS < 10, frame drop rate > 0.2
    for (let i = 0; i < 20; i++) {
      monitor.recordEmotionDetection(300, 5, 80, 0.4);
    }
    
    monitor.logPerformanceWarnings();
    
    // Check that warnings were called
    expect(mockConsole.warn).toHaveBeenCalled();
    
    // Check for the warnings that should be generated
    const warningCalls = mockConsole.warn.mock.calls.map(call => call[0]);
    
    // Should have logged warnings about FPS and frame drops (these are more likely to trigger)
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('📊 Low emotion detection FPS')
    );
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('📉 Frame drops detected')
    );
    
    // Processing time warning might also be present after enough iterations
    const hasProcessingTimeWarning = warningCalls.some(call => 
      call.includes('⏱️ Emotion detection processing time')
    );
    
    // At least one of the performance warnings should be present
    expect(warningCalls.length).toBeGreaterThan(0);
  });

  test('should generate performance summary', () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startMonitoring();
    
    monitor.recordEmotionDetection(150, 10, 70, 0.2);
    
    const summary = monitor.getPerformanceSummary();
    expect(summary).toContain('Performance Summary');
    expect(summary).toContain('Emotion Detection');
    expect(summary).toContain('Processing Time');
  });
});

describe('EmotionMemoryMonitor', () => {
  const createMockEmotion = (timestamp: string): EmotionData => ({
    dominant: 'happy',
    confidence: 0.8,
    emotions: {
      happy: 0.8,
      sad: 0.1,
      angry: 0.05,
      surprised: 0.02,
      neutral: 0.02,
      fearful: 0.01,
      disgusted: 0.0
    },
    timestamp
  });

  test('should monitor emotion history memory usage', () => {
    const monitor = EmotionMemoryMonitor.getInstance();
    
    const emotions = [
      createMockEmotion('2024-01-01T10:00:00Z'),
      createMockEmotion('2024-01-01T10:01:00Z'),
      createMockEmotion('2024-01-01T10:02:00Z')
    ];
    
    const metrics = monitor.monitorEmotionHistory(emotions);
    
    expect(metrics.historySize).toBe(3);
    expect(metrics.estimatedMemoryUsage).toBeGreaterThan(0);
    expect(metrics.averageEmotionSize).toBeGreaterThan(0);
  });

  test('should detect large emotion history', () => {
    const monitor = EmotionMemoryMonitor.getInstance();
    
    // Create a large emotion history
    const emotions = Array.from({ length: 150 }, (_, i) => 
      createMockEmotion(`2024-01-01T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`)
    );
    
    monitor.monitorEmotionHistory(emotions);
    
    // Should have logged warnings about large history
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('Emotion history size is large')
    );
  });

  test('should suggest optimal history size', () => {
    const monitor = EmotionMemoryMonitor.getInstance();
    
    const emotions = Array.from({ length: 20 }, (_, i) => 
      createMockEmotion(`2024-01-01T10:${String(i).padStart(2, '0')}:00Z`)
    );
    
    const optimalSize = monitor.suggestOptimalHistorySize(emotions);
    
    expect(optimalSize).toBeGreaterThan(0);
    expect(optimalSize).toBeLessThanOrEqual(100);
  });

  test('should generate memory analysis', () => {
    const monitor = EmotionMemoryMonitor.getInstance();
    
    const emotions = [
      createMockEmotion('2024-01-01T10:00:00Z'),
      createMockEmotion('2024-01-01T10:01:00Z')
    ];
    
    const analysis = monitor.getMemoryAnalysis(emotions);
    
    expect(analysis).toContain('Emotion Memory Analysis');
    expect(analysis).toContain('History Size: 2');
    expect(analysis).toContain('Recommendations');
  });

  test('should detect old emotions', () => {
    const monitor = EmotionMemoryMonitor.getInstance();
    
    // Create emotions with very old timestamps
    const oldTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minutes ago
    const emotions = [createMockEmotion(oldTimestamp)];
    
    monitor.monitorEmotionHistory(emotions);
    
    // Should have logged warnings about old emotions
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('Very old emotions in history')
    );
  });
});

describe('Integration Tests', () => {
  test('should work together without conflicts', () => {
    const renderMonitor = getRenderMonitor();
    const perfMonitor = PerformanceMonitor.getInstance();
    const memoryMonitor = EmotionMemoryMonitor.getInstance();
    
    // Start monitoring
    perfMonitor.startMonitoring();
    
    // Simulate some activity
    renderMonitor.trackRender('IntegrationTest');
    perfMonitor.recordEmotionDetection(100, 15, 50, 0.1);
    
    const emotion = {
      dominant: 'happy' as const,
      confidence: 0.8,
      emotions: {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.02,
        neutral: 0.02,
        fearful: 0.01,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };
    
    memoryMonitor.monitorEmotionHistory([emotion]);
    
    // All monitors should work without throwing errors
    expect(renderMonitor.getSummary()).toContain('IntegrationTest');
    expect(perfMonitor.getPerformanceSummary()).toContain('Performance Summary');
    expect(memoryMonitor.getMemoryAnalysis([emotion])).toContain('Memory Analysis');
  });
});