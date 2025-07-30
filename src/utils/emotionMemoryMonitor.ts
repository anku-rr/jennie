/**
 * Memory monitoring utilities specifically for emotion detection and history
 */

import { EmotionData } from '@/types';

interface EmotionMemoryMetrics {
  historySize: number;
  estimatedMemoryUsage: number;
  averageEmotionSize: number;
  oldestEmotionAge: number;
  newestEmotionAge: number;
  memoryGrowthRate: number;
}

class EmotionMemoryMonitor {
  private static instance: EmotionMemoryMonitor;
  private memorySnapshots: number[] = [];
  private lastHistorySize = 0;
  private warningThresholds = {
    maxHistorySize: 100,
    maxMemoryUsage: 5 * 1024 * 1024, // 5MB
    maxGrowthRate: 1024 * 1024, // 1MB per minute
  };

  private constructor() {}

  public static getInstance(): EmotionMemoryMonitor {
    if (!EmotionMemoryMonitor.instance) {
      EmotionMemoryMonitor.instance = new EmotionMemoryMonitor();
    }
    return EmotionMemoryMonitor.instance;
  }

  /**
   * Calculate the approximate memory usage of an emotion data object
   */
  private calculateEmotionSize(emotion: EmotionData): number {
    // Rough estimation of memory usage for an EmotionData object
    let size = 0;
    
    // String properties
    size += emotion.dominant.length * 2; // UTF-16 encoding
    size += emotion.timestamp.length * 2;
    
    // Number properties (8 bytes each for double precision)
    size += 8; // confidence
    size += 8 * 7; // emotions object (7 emotion values)
    
    // Object overhead (rough estimate)
    size += 100; // Object structure overhead
    
    return size;
  }

  /**
   * Monitor emotion history memory usage
   */
  public monitorEmotionHistory(emotionHistory: EmotionData[]): EmotionMemoryMetrics {
    const now = Date.now();
    const historySize = emotionHistory.length;
    
    // Calculate total estimated memory usage
    let totalMemoryUsage = 0;
    let oldestTimestamp = now;
    let newestTimestamp = 0;
    
    emotionHistory.forEach(emotion => {
      totalMemoryUsage += this.calculateEmotionSize(emotion);
      
      const emotionTime = new Date(emotion.timestamp).getTime();
      if (emotionTime < oldestTimestamp) oldestTimestamp = emotionTime;
      if (emotionTime > newestTimestamp) newestTimestamp = emotionTime;
    });
    
    const averageEmotionSize = historySize > 0 ? totalMemoryUsage / historySize : 0;
    const oldestEmotionAge = historySize > 0 ? now - oldestTimestamp : 0;
    const newestEmotionAge = historySize > 0 ? now - newestTimestamp : 0;
    
    // Calculate memory growth rate
    this.memorySnapshots.push(totalMemoryUsage);
    if (this.memorySnapshots.length > 10) {
      this.memorySnapshots.shift();
    }
    
    let memoryGrowthRate = 0;
    if (this.memorySnapshots.length >= 2) {
      const oldestSnapshot = this.memorySnapshots[0];
      const newestSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
      if (oldestSnapshot !== undefined && newestSnapshot !== undefined) {
        const timeSpan = this.memorySnapshots.length * 5000; // Assuming 5-second intervals
        memoryGrowthRate = (newestSnapshot - oldestSnapshot) / (timeSpan / 60000); // Per minute
      }
    }
    
    const metrics: EmotionMemoryMetrics = {
      historySize,
      estimatedMemoryUsage: totalMemoryUsage,
      averageEmotionSize,
      oldestEmotionAge,
      newestEmotionAge,
      memoryGrowthRate
    };
    
    // Check for issues and log warnings
    this.checkMemoryIssues(metrics);
    
    this.lastHistorySize = historySize;
    return metrics;
  }

  /**
   * Check for memory-related issues with emotion history
   */
  private checkMemoryIssues(metrics: EmotionMemoryMetrics): void {
    const warnings: string[] = [];
    
    // Check history size
    if (metrics.historySize > this.warningThresholds.maxHistorySize) {
      warnings.push(`📊 Emotion history size is large: ${metrics.historySize} items (recommended: <${this.warningThresholds.maxHistorySize})`);
    }
    
    // Check memory usage
    const memoryMB = metrics.estimatedMemoryUsage / 1024 / 1024;
    if (metrics.estimatedMemoryUsage > this.warningThresholds.maxMemoryUsage) {
      warnings.push(`🧠 Emotion history memory usage: ${memoryMB.toFixed(2)}MB (recommended: <${(this.warningThresholds.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    // Check growth rate
    if (metrics.memoryGrowthRate > this.warningThresholds.maxGrowthRate) {
      const growthMB = metrics.memoryGrowthRate / 1024 / 1024;
      warnings.push(`📈 High memory growth rate: ${growthMB.toFixed(2)}MB/min (recommended: <${(this.warningThresholds.maxGrowthRate / 1024 / 1024).toFixed(1)}MB/min)`);
    }
    
    // Check for very old emotions that might indicate cleanup issues
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (metrics.oldestEmotionAge > maxAge) {
      const ageMinutes = metrics.oldestEmotionAge / 60000;
      warnings.push(`⏰ Very old emotions in history: ${ageMinutes.toFixed(1)} minutes old (consider cleanup after ${maxAge / 60000} minutes)`);
    }
    
    // Log warnings if any issues found
    if (warnings.length > 0) {
      console.group('🔍 Emotion Memory Analysis');
      warnings.forEach(warning => console.warn(warning));
      console.info('💡 Consider implementing emotion history cleanup or reducing retention time');
      console.groupEnd();
    }
  }

  /**
   * Get detailed memory analysis
   */
  public getMemoryAnalysis(emotionHistory: EmotionData[]): string {
    const metrics = this.monitorEmotionHistory(emotionHistory);
    
    let analysis = '=== Emotion Memory Analysis ===\n';
    analysis += `History Size: ${metrics.historySize} emotions\n`;
    analysis += `Estimated Memory: ${(metrics.estimatedMemoryUsage / 1024).toFixed(1)}KB\n`;
    analysis += `Average Emotion Size: ${metrics.averageEmotionSize.toFixed(0)} bytes\n`;
    analysis += `Oldest Emotion: ${(metrics.oldestEmotionAge / 60000).toFixed(1)} minutes ago\n`;
    analysis += `Newest Emotion: ${(metrics.newestEmotionAge / 1000).toFixed(1)} seconds ago\n`;
    analysis += `Growth Rate: ${(metrics.memoryGrowthRate / 1024).toFixed(1)}KB/min\n`;
    
    // Add recommendations
    analysis += '\n=== Recommendations ===\n';
    if (metrics.historySize > 50) {
      analysis += '• Consider reducing emotion history retention\n';
    }
    if (metrics.estimatedMemoryUsage > 1024 * 1024) {
      analysis += '• Memory usage is high, implement cleanup strategy\n';
    }
    if (metrics.memoryGrowthRate > 512 * 1024) {
      analysis += '• High growth rate detected, check for memory leaks\n';
    }
    if (metrics.oldestEmotionAge > 5 * 60 * 1000) {
      analysis += '• Old emotions detected, consider automatic cleanup\n';
    }
    
    return analysis;
  }

  /**
   * Suggest optimal history size based on current usage patterns
   */
  public suggestOptimalHistorySize(emotionHistory: EmotionData[]): number {
    const metrics = this.monitorEmotionHistory(emotionHistory);
    
    // Base recommendation on memory usage and age
    const targetMemoryUsage = 1024 * 1024; // 1MB target
    const optimalSizeByMemory = Math.floor(targetMemoryUsage / metrics.averageEmotionSize);
    
    // Base recommendation on time (keep last 5 minutes of data)
    const targetAge = 5 * 60 * 1000; // 5 minutes
    const recentEmotions = emotionHistory.filter(emotion => {
      const age = Date.now() - new Date(emotion.timestamp).getTime();
      return age <= targetAge;
    });
    const optimalSizeByAge = recentEmotions.length;
    
    // Use the more conservative estimate
    const suggestedSize = Math.min(optimalSizeByMemory, optimalSizeByAge, 100);
    
    return Math.max(suggestedSize, 10); // Minimum of 10 emotions
  }

  /**
   * Configure warning thresholds
   */
  public setThresholds(thresholds: Partial<typeof this.warningThresholds>): void {
    this.warningThresholds = { ...this.warningThresholds, ...thresholds };
  }

  /**
   * Reset monitoring state
   */
  public reset(): void {
    this.memorySnapshots = [];
    this.lastHistorySize = 0;
  }
}

/**
 * React hook for monitoring emotion history memory usage
 */
export function useEmotionMemoryMonitor(emotionHistory: EmotionData[]) {
  const monitor = EmotionMemoryMonitor.getInstance();
  
  React.useEffect(() => {
    // Monitor memory usage when history changes
    const metrics = monitor.monitorEmotionHistory(emotionHistory);
    
    // Log analysis in development mode
    if (process.env.NODE_ENV === 'development' && emotionHistory.length > 0) {
      // Only log every 10th update to avoid spam
      if (emotionHistory.length % 10 === 0) {
        console.log(monitor.getMemoryAnalysis(emotionHistory));
      }
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [emotionHistory, monitor]);
  
  return {
    getMemoryAnalysis: (history: EmotionData[]) => monitor.getMemoryAnalysis(history),
    suggestOptimalHistorySize: (history: EmotionData[]) => monitor.suggestOptimalHistorySize(history),
    monitorEmotionHistory: (history: EmotionData[]) => monitor.monitorEmotionHistory(history)
  };
}

// Export the monitor instance
export { EmotionMemoryMonitor };

// Import React for the hook
import React from 'react';