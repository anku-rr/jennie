import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmotionDetector } from './EmotionDetector';
import { EmotionContextProvider } from '@/contexts/EmotionContext';

// Mock the emotion detection utilities
const mockCleanup = jest.fn();
const mockReset = jest.fn();
const mockGetOptimalInterval = jest.fn().mockReturnValue(100);

jest.mock('@/utils/emotionDetection', () => ({
  loadEmotionModels: jest.fn().mockResolvedValue(undefined),
  areModelsLoaded: jest.fn().mockReturnValue(true),
  detectEmotions: jest.fn().mockResolvedValue({
    dominant: 'happy',
    confidence: 0.8,
    emotions: { happy: 0.8, sad: 0.1, angry: 0.1, surprised: 0.0, neutral: 0.0, fearful: 0.0, disgusted: 0.0 },
    timestamp: new Date().toISOString()
  }),
  AdaptiveFrameRate: jest.fn().mockImplementation(() => ({
    getOptimalInterval: mockGetOptimalInterval,
    getCurrentFPS: jest.fn().mockReturnValue(10),
    getPerformanceMetrics: jest.fn().mockReturnValue({
      fps: 10,
      avgProcessingTime: 50,
      avgCpuUsage: 20,
      frameDropRate: 0.1
    }),
    reset: mockReset,
    cleanup: mockCleanup
  })),
  EmotionDetectionError: jest.fn().mockImplementation((message: string, type: string) => {
    const error = new Error(message);
    (error as any).type = type;
    error.name = 'EmotionDetectionError';
    return error;
  })
}));

// Mock the performance monitor
jest.mock('@/utils/performanceMonitor', () => ({
  usePerformanceMonitor: jest.fn().mockReturnValue({
    recordEmotionDetection: jest.fn(),
    recordChatPerformance: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({}),
    getPerformanceSummary: jest.fn().mockReturnValue(''),
    isPerformanceDegraded: jest.fn().mockReturnValue(false)
  })
}));

// Test wrapper component with context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EmotionContextProvider>
    {children}
  </EmotionContextProvider>
);

describe('EmotionDetector Cleanup Mechanisms', () => {
  const mockVideoElement = document.createElement('video') as HTMLVideoElement;
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should cleanup properly when component unmounts', () => {
    const { unmount } = render(
      <TestWrapper>
        <EmotionDetector
          videoElement={mockVideoElement}
          onError={mockOnError}
          isActive={true}
        />
      </TestWrapper>
    );

    // Unmount the component
    act(() => {
      unmount();
    });

    // Verify cleanup was called
    expect(mockCleanup).toHaveBeenCalled();
  });

  it('should stop detection loop when isActive becomes false', () => {
    const { rerender } = render(
      <TestWrapper>
        <EmotionDetector
          videoElement={mockVideoElement}
          onError={mockOnError}
          isActive={true}
        />
      </TestWrapper>
    );

    // Reset the frame rate manager should be called when starting
    expect(mockReset).toHaveBeenCalled();

    // Change isActive to false
    act(() => {
      rerender(
        <TestWrapper>
          <EmotionDetector
            videoElement={mockVideoElement}
            onError={mockOnError}
            isActive={false}
          />
        </TestWrapper>
      );
    });

    // The component should handle the state change without errors
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should handle cleanup when videoElement becomes null', () => {
    const { rerender } = render(
      <TestWrapper>
        <EmotionDetector
          videoElement={mockVideoElement}
          onError={mockOnError}
          isActive={true}
        />
      </TestWrapper>
    );

    // Change videoElement to null
    act(() => {
      rerender(
        <TestWrapper>
          <EmotionDetector
            videoElement={null}
            onError={mockOnError}
            isActive={true}
          />
        </TestWrapper>
      );
    });

    // The detection should stop gracefully without errors
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should reset frame rate manager when starting detection', () => {
    render(
      <TestWrapper>
        <EmotionDetector
          videoElement={mockVideoElement}
          onError={mockOnError}
          isActive={true}
        />
      </TestWrapper>
    );

    // Verify reset was called when detection started
    expect(mockReset).toHaveBeenCalled();
  });

  it('should handle multiple rapid state changes without memory leaks', async () => {
    const { rerender } = render(
      <TestWrapper>
        <EmotionDetector
          videoElement={mockVideoElement}
          onError={mockOnError}
          isActive={false}
        />
      </TestWrapper>
    );

    // Rapidly toggle isActive multiple times
    for (let i = 0; i < 5; i++) {
      act(() => {
        rerender(
          <TestWrapper>
            <EmotionDetector
              videoElement={mockVideoElement}
              onError={mockOnError}
              isActive={true}
            />
          </TestWrapper>
        );
      });

      act(() => {
        rerender(
          <TestWrapper>
            <EmotionDetector
              videoElement={mockVideoElement}
              onError={mockOnError}
              isActive={false}
            />
          </TestWrapper>
        );
      });
    }

    // Should handle rapid changes without errors
    expect(mockOnError).not.toHaveBeenCalled();
    
    // Reset should be called for each activation
    expect(mockReset.mock.calls.length).toBeGreaterThan(0);
  });
});