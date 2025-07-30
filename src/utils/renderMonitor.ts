/**
 * Re-render detection utility to identify infinite loops and excessive re-renders
 */

interface RenderInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  renderTimes: number[];
  props?: Record<string, any>;
}

class RenderMonitor {
  private static instance: RenderMonitor;
  private renderCounts = new Map<string, RenderInfo>();
  private warningThresholds = {
    maxRendersPerSecond: 10,
    maxConsecutiveRenders: 5,
    infiniteLoopThreshold: 50
  };

  private constructor() {}

  public static getInstance(): RenderMonitor {
    if (!RenderMonitor.instance) {
      RenderMonitor.instance = new RenderMonitor();
    }
    return RenderMonitor.instance;
  }

  /**
   * Track a component render
   */
  public trackRender(componentName: string, props?: Record<string, any>): void {
    const now = performance.now();
    const existing = this.renderCounts.get(componentName);

    if (!existing) {
      this.renderCounts.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: now,
        renderTimes: [now],
        ...(props && { props })
      });
      return;
    }

    // Update render info
    existing.renderCount++;
    existing.renderTimes.push(now);
    if (props) {
      existing.props = props;
    }

    // Keep only recent render times (last 5 seconds)
    const fiveSecondsAgo = now - 5000;
    existing.renderTimes = existing.renderTimes.filter(time => time > fiveSecondsAgo);

    // Check for performance issues
    this.checkForIssues(existing, now);

    existing.lastRenderTime = now;
  }

  /**
   * Check for render performance issues
   */
  private checkForIssues(renderInfo: RenderInfo, currentTime: number): void {
    const { componentName, renderCount, renderTimes } = renderInfo;

    // Check for infinite loop (too many total renders)
    if (renderCount > this.warningThresholds.infiniteLoopThreshold) {
      console.error(`🔄 INFINITE LOOP DETECTED: ${componentName} has rendered ${renderCount} times!`);
      console.error('This indicates a serious performance issue that needs immediate attention.');
      
      // Reset counter to prevent spam
      renderInfo.renderCount = 0;
      return;
    }

    // Check for excessive renders per second
    const rendersInLastSecond = renderTimes.filter(time => time > currentTime - 1000).length;
    if (rendersInLastSecond > this.warningThresholds.maxRendersPerSecond) {
      console.warn(`⚠️ EXCESSIVE RENDERS: ${componentName} rendered ${rendersInLastSecond} times in the last second`);
      console.warn('Consider using React.memo, useMemo, or useCallback to optimize this component.');
    }

    // Check for consecutive rapid renders
    const recentRenders = renderTimes.slice(-this.warningThresholds.maxConsecutiveRenders);
    if (recentRenders.length === this.warningThresholds.maxConsecutiveRenders) {
      const lastRender = recentRenders[recentRenders.length - 1];
      const firstRender = recentRenders[0];
      if (lastRender !== undefined && firstRender !== undefined) {
        const timeSpan = lastRender - firstRender;
        if (timeSpan < 100) { // 5 renders in less than 100ms
          console.warn(`⚡ RAPID RENDERS: ${componentName} rendered ${this.warningThresholds.maxConsecutiveRenders} times in ${timeSpan.toFixed(1)}ms`);
          console.warn('This may indicate unstable dependencies or state updates.');
        }
      }
    }
  }

  /**
   * Get render statistics for all components
   */
  public getRenderStats(): Map<string, RenderInfo> {
    return new Map(this.renderCounts);
  }

  /**
   * Get render statistics for a specific component
   */
  public getComponentStats(componentName: string): RenderInfo | undefined {
    return this.renderCounts.get(componentName);
  }

  /**
   * Reset render counts (useful for testing)
   */
  public reset(): void {
    this.renderCounts.clear();
  }

  /**
   * Get a summary of render performance
   */
  public getSummary(): string {
    let summary = '=== Render Performance Summary ===\n';
    
    if (this.renderCounts.size === 0) {
      summary += 'No render data collected.\n';
      return summary;
    }

    const sortedComponents = Array.from(this.renderCounts.values())
      .sort((a, b) => b.renderCount - a.renderCount);

    sortedComponents.forEach(info => {
      let avgRenderTime = 0;
      if (info.renderTimes.length > 1) {
        const lastTime = info.renderTimes[info.renderTimes.length - 1];
        const firstTime = info.renderTimes[0];
        if (lastTime !== undefined && firstTime !== undefined) {
          avgRenderTime = (lastTime - firstTime) / (info.renderTimes.length - 1);
        }
      }
      
      summary += `${info.componentName}:\n`;
      summary += `  Total Renders: ${info.renderCount}\n`;
      summary += `  Recent Renders: ${info.renderTimes.length}\n`;
      summary += `  Avg Interval: ${avgRenderTime.toFixed(1)}ms\n`;
      summary += `  Last Render: ${new Date(info.lastRenderTime).toLocaleTimeString()}\n\n`;
    });

    return summary;
  }

  /**
   * Configure warning thresholds
   */
  public setThresholds(thresholds: Partial<typeof this.warningThresholds>): void {
    this.warningThresholds = { ...this.warningThresholds, ...thresholds };
  }
}

/**
 * React hook to track component renders
 */
export function useRenderTracker(componentName: string, props?: Record<string, any>): void {
  const monitor = RenderMonitor.getInstance();
  
  // Track every render
  monitor.trackRender(componentName, props);
}

/**
 * Higher-order component to automatically track renders
 */
export function withRenderTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const TrackedComponent = (props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    useRenderTracker(name, props as Record<string, any>);
    
    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withRenderTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  
  return TrackedComponent;
}

/**
 * Get the render monitor instance for manual tracking
 */
export function getRenderMonitor(): RenderMonitor {
  return RenderMonitor.getInstance();
}

// Export the monitor instance for direct access
export { RenderMonitor };

// Import React for the hook and HOC
import React from 'react';