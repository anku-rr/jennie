/**
 * Performance monitoring utilities for emotion detection and real-time features
 */

export interface PerformanceMetrics {
  emotionDetection: {
    averageProcessingTime: number;
    framesPerSecond: number;
    cpuUsage: number;
    frameDropRate: number;
    memoryUsage?: number;
  };
  chatInterface: {
    messageRenderTime: number;
    scrollPerformance: number;
    inputLatency: number;
  };
  overall: {
    memoryUsage: number;
    jsHeapSize: number;
    domNodes: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Record emotion detection performance
   */
  public recordEmotionDetection(processingTime: number, fps: number, cpuUsage: number, frameDropRate: number): void {
    if (!this.metrics.emotionDetection) {
      this.metrics.emotionDetection = {
        averageProcessingTime: 0,
        framesPerSecond: 0,
        cpuUsage: 0,
        frameDropRate: 0
      };
    }

    // Use exponential moving average for smooth metrics
    const alpha = 0.1;
    this.metrics.emotionDetection.averageProcessingTime = 
      this.metrics.emotionDetection.averageProcessingTime * (1 - alpha) + processingTime * alpha;
    this.metrics.emotionDetection.framesPerSecond = 
      this.metrics.emotionDetection.framesPerSecond * (1 - alpha) + fps * alpha;
    this.metrics.emotionDetection.cpuUsage = 
      this.metrics.emotionDetection.cpuUsage * (1 - alpha) + cpuUsage * alpha;
    this.metrics.emotionDetection.frameDropRate = 
      this.metrics.emotionDetection.frameDropRate * (1 - alpha) + frameDropRate * alpha;
  }

  /**
   * Record chat interface performance
   */
  public recordChatPerformance(messageRenderTime: number, scrollPerformance: number, inputLatency: number): void {
    if (!this.metrics.chatInterface) {
      this.metrics.chatInterface = {
        messageRenderTime: 0,
        scrollPerformance: 0,
        inputLatency: 0
      };
    }

    const alpha = 0.1;
    this.metrics.chatInterface.messageRenderTime = 
      this.metrics.chatInterface.messageRenderTime * (1 - alpha) + messageRenderTime * alpha;
    this.metrics.chatInterface.scrollPerformance = 
      this.metrics.chatInterface.scrollPerformance * (1 - alpha) + scrollPerformance * alpha;
    this.metrics.chatInterface.inputLatency = 
      this.metrics.chatInterface.inputLatency * (1 - alpha) + inputLatency * alpha;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get performance summary for debugging
   */
  public getPerformanceSummary(): string {
    const metrics = this.getMetrics();
    
    let summary = '=== Performance Summary ===\n';
    
    if (metrics.emotionDetection) {
      summary += `Emotion Detection:\n`;
      summary += `  Processing Time: ${metrics.emotionDetection.averageProcessingTime.toFixed(1)}ms\n`;
      summary += `  FPS: ${metrics.emotionDetection.framesPerSecond.toFixed(1)}\n`;
      summary += `  CPU Usage: ${metrics.emotionDetection.cpuUsage.toFixed(1)}%\n`;
      summary += `  Frame Drop Rate: ${(metrics.emotionDetection.frameDropRate * 100).toFixed(1)}%\n`;
    }
    
    if (metrics.chatInterface) {
      summary += `Chat Interface:\n`;
      summary += `  Message Render: ${metrics.chatInterface.messageRenderTime.toFixed(1)}ms\n`;
      summary += `  Scroll Performance: ${metrics.chatInterface.scrollPerformance.toFixed(1)}ms\n`;
      summary += `  Input Latency: ${metrics.chatInterface.inputLatency.toFixed(1)}ms\n`;
    }
    
    if (metrics.overall) {
      summary += `Overall:\n`;
      summary += `  Memory Usage: ${(metrics.overall.memoryUsage / 1024 / 1024).toFixed(1)}MB\n`;
      summary += `  JS Heap Size: ${(metrics.overall.jsHeapSize / 1024 / 1024).toFixed(1)}MB\n`;
      summary += `  DOM Nodes: ${metrics.overall.domNodes}\n`;
    }
    
    return summary;
  }

  /**
   * Check if performance is degraded and log detailed warnings
   */
  public isPerformanceDegraded(): boolean {
    const metrics = this.getMetrics();
    let isDegraded = false;
    const warnings: string[] = [];
    
    // Check emotion detection performance
    if (metrics.emotionDetection) {
      if (metrics.emotionDetection.averageProcessingTime > 200) {
        isDegraded = true;
        warnings.push(`🐌 Emotion detection processing time is high: ${metrics.emotionDetection.averageProcessingTime.toFixed(1)}ms (target: <200ms)`);
      }
      
      if (metrics.emotionDetection.framesPerSecond < 5) {
        isDegraded = true;
        warnings.push(`📉 Emotion detection FPS is low: ${metrics.emotionDetection.framesPerSecond.toFixed(1)} (target: >5 FPS)`);
      }
      
      if (metrics.emotionDetection.frameDropRate > 0.3) {
        isDegraded = true;
        warnings.push(`⚠️ High frame drop rate: ${(metrics.emotionDetection.frameDropRate * 100).toFixed(1)}% (target: <30%)`);
      }
    }
    
    // Check chat interface performance
    if (metrics.chatInterface) {
      if (metrics.chatInterface.messageRenderTime > 100) {
        isDegraded = true;
        warnings.push(`💬 Message render time is slow: ${metrics.chatInterface.messageRenderTime.toFixed(1)}ms (target: <100ms)`);
      }
      
      if (metrics.chatInterface.inputLatency > 50) {
        isDegraded = true;
        warnings.push(`⌨️ Input latency is high: ${metrics.chatInterface.inputLatency.toFixed(1)}ms (target: <50ms)`);
      }
    }
    
    // Check overall system performance
    if (metrics.overall) {
      const memoryMB = metrics.overall.memoryUsage / 1024 / 1024;
      if (memoryMB > 100) {
        isDegraded = true;
        warnings.push(`🧠 Memory usage is high: ${memoryMB.toFixed(1)}MB (target: <100MB)`);
      }
      
      if (metrics.overall.domNodes > 5000) {
        isDegraded = true;
        warnings.push(`🏗️ DOM node count is high: ${metrics.overall.domNodes} (target: <5000)`);
      }
    }
    
    // Log warnings if performance is degraded
    if (isDegraded && warnings.length > 0) {
      console.group('🚨 Performance Degradation Detected');
      warnings.forEach(warning => console.warn(warning));
      console.warn('💡 Consider reducing quality settings or optimizing components');
      console.groupEnd();
    }
    
    return isDegraded;
  }

  /**
   * Setup performance observers for automatic monitoring
   */
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration.toFixed(1)}ms`);
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.value > 0.1) { // Significant layout shift
            console.warn(`Layout shift detected: ${entry.value.toFixed(3)}`);
          }
        });
      });
      
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutShiftObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  /**
   * Log performance warnings based on current metrics
   */
  public logPerformanceWarnings(): void {
    const metrics = this.getMetrics();
    
    // Emotion detection warnings
    if (metrics.emotionDetection) {
      const ed = metrics.emotionDetection;
      
      if (ed.averageProcessingTime > 150) {
        console.warn(`⏱️ Emotion detection processing time: ${ed.averageProcessingTime.toFixed(1)}ms`);
        if (ed.averageProcessingTime > 300) {
          console.warn('💡 Consider reducing video resolution or detection frequency');
        }
      }
      
      if (ed.framesPerSecond < 10) {
        console.warn(`📊 Low emotion detection FPS: ${ed.framesPerSecond.toFixed(1)}`);
        if (ed.framesPerSecond < 3) {
          console.error('🚨 Critical: Emotion detection FPS is critically low');
        }
      }
      
      if (ed.frameDropRate > 0.2) {
        console.warn(`📉 Frame drops detected: ${(ed.frameDropRate * 100).toFixed(1)}%`);
      }
    }
    
    // Memory warnings
    if (metrics.overall) {
      const memoryMB = metrics.overall.memoryUsage / 1024 / 1024;
      const heapMB = metrics.overall.jsHeapSize / 1024 / 1024;
      
      if (memoryMB > 75) {
        console.warn(`🧠 Memory usage: ${memoryMB.toFixed(1)}MB`);
        if (memoryMB > 150) {
          console.error('🚨 Critical: High memory usage detected');
        }
      }
      
      if (heapMB > 100) {
        console.warn(`📦 JS Heap size: ${heapMB.toFixed(1)}MB`);
      }
      
      if (metrics.overall.domNodes > 3000) {
        console.warn(`🏗️ High DOM node count: ${metrics.overall.domNodes}`);
      }
    }
  }

  /**
   * Check for memory leaks by monitoring growth patterns
   */
  public checkForMemoryLeaks(): boolean {
    if (!this.metrics.overall) return false;
    
    const currentMemory = this.metrics.overall.memoryUsage;
    const memoryHistory = this.getMemoryHistory();
    
    if (memoryHistory.length < 5) return false; // Need enough data points
    
    // Check if memory is consistently growing
    let growthCount = 0;
    for (let i = 1; i < memoryHistory.length; i++) {
      const current = memoryHistory[i];
      const previous = memoryHistory[i - 1];
      if (current !== undefined && previous !== undefined && current > previous) {
        growthCount++;
      }
    }
    
    const growthRatio = growthCount / (memoryHistory.length - 1);
    if (growthRatio > 0.8) { // 80% of measurements show growth
      console.error('🚨 Potential memory leak detected: Memory usage consistently growing');
      console.warn('💡 Check for uncleaned event listeners, intervals, or references');
      return true;
    }
    
    return false;
  }

  private memoryHistory: number[] = [];
  
  private getMemoryHistory(): number[] {
    return this.memoryHistory;
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    // Initialize overall metrics immediately
    if (!this.metrics.overall) {
      this.metrics.overall = {
        memoryUsage: 0,
        jsHeapSize: 0,
        domNodes: 0
      };
    }

    const updateMemoryMetrics = () => {
      if (!this.isMonitoring) return;

      try {
        // Get memory info if available
        const memory = (performance as any).memory;
        let domNodes = 0;
        
        // Only count DOM nodes if we're in a browser environment
        if (typeof document !== 'undefined') {
          domNodes = document.querySelectorAll('*').length;
        }

        if (memory) {
          this.metrics.overall!.memoryUsage = memory.usedJSHeapSize;
          this.metrics.overall!.jsHeapSize = memory.totalJSHeapSize;
        } else {
          // Fallback values for testing environment
          this.metrics.overall!.memoryUsage = 10 * 1024 * 1024; // 10MB
          this.metrics.overall!.jsHeapSize = 50 * 1024 * 1024; // 50MB
        }
        
        this.metrics.overall!.domNodes = domNodes;
        
        // Track memory history for leak detection
        this.memoryHistory.push(this.metrics.overall!.memoryUsage);
        // Keep only last 20 measurements (about 100 seconds of history)
        if (this.memoryHistory.length > 20) {
          this.memoryHistory.shift();
        }
        
        // Periodically check for memory leaks
        if (this.memoryHistory.length >= 10) {
          this.checkForMemoryLeaks();
        }

        // Schedule next update
        if (this.isMonitoring) {
          setTimeout(updateMemoryMetrics, 5000); // Update every 5 seconds
        }
      } catch (error) {
        console.warn('Memory monitoring failed:', error);
      }
    };

    updateMemoryMetrics();
  }
}

/**
 * Hook for using performance monitoring in React components
 */
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.startMonitoring();
    return () => monitor.stopMonitoring();
  }, [monitor]);

  return {
    recordEmotionDetection: monitor.recordEmotionDetection.bind(monitor),
    recordChatPerformance: monitor.recordChatPerformance.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getPerformanceSummary: monitor.getPerformanceSummary.bind(monitor),
    isPerformanceDegraded: monitor.isPerformanceDegraded.bind(monitor),
    logPerformanceWarnings: monitor.logPerformanceWarnings.bind(monitor),
    checkForMemoryLeaks: monitor.checkForMemoryLeaks.bind(monitor)
  };
}

// Import React for the hook
import React from 'react';