import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmotionDetector } from './EmotionDetector';
import { EmotionContextProvider } from '@/contexts/EmotionContext';

// Mock the emotion detection utilities
const mockLoadEmotionModels = jest.fn();
const mockAreModelsLoaded = jest.fn();
const mockDetectEmotions = jest.fn();

jest.mock('@/utils/emotionDetection', () => ({
  loadEmotionModels: mockLoadEmotionModels,
  areModelsLoaded: mockAreModelsLoaded,
  areModelsLoadedAndVerified: jest.fn().mockResolvedValue(true),
  detectEmotions: mockDetectEmotions,
  AdaptiveFrameRate: jest.fn().mockImplementation(() => ({
    getOptimalInterval: jest.fn().mockReturnValue(100),
    getCurrentFPS: jest.fn().mockReturnValue(10),
    getPerformanceMetrics: jest.fn().mockReturnValue({
      fps: 10,
      avgCpuUsage: 20,
      frameDropRate: 0.1
    }),
    reset: jest.fn(),
    cleanup: jest.fn()
  })),
  EmotionDetectionError: jest.fn().mockImplementation((message: string, type: string) => {
    const error = new Error(message);
    (error as any).type = type;
    error.name = 'EmotionDetectionError';
    return error;
  })
}));

// Mock other utilities
jest.mock('@/utils/performanceMonitor', () => ({
  usePerformanceMonitor: jest.fn().mockReturnValue({
    recordEmotionDetection: jest.fn(),
    recordChatPerformance: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({}),
    getPerformanceSummary: jest.fn().mockReturnValue(''),
    isPerformanceDegraded: jest.fn().mockReturnValue(false),
    logPerformanceWarnings: jest.fn()
  })
}));

jest.mock('@/utils/videoValidation', () => ({
  isVideoElementReady: jest.fn().mockReturnValue(true),
  getVideoStatusDescription: jest.fn().mockReturnValue('Video ready'),
  validateVideoElement: jest.fn().mockReturnValue({
    isValid: true,
    isReady: true,
    errors: [],
    warnings: []
  })
}));

jest.mock('@/utils/emotionDebug', () => ({
  logVideoStatus: jest.fn().mockReturnValue({
    isConnected: true,
    isPlaying: true,
    hasValidDimensions: true,
    readyState: 4,
    currentTime: 1.0,
    videoWidth: 640,
    videoHeight: 480,
    duration: 0,
    paused: false,
    ended: false,
    muted: false,
    srcObject: {},
    volume: 1,
    playbackRate: 1,
    networkState: 1,
    error: null,
    validationResult: {
      isValid: true,
      isReady: true,
      errors: [],
      warnings: [],
      status: {
        isConnected: true,
        isPlaying: true,
        hasValidDimensions: true,
        readyState: 4,
        currentTime: 1.0,
        videoWidth: 640,
        videoHeight: 480,
        duration: 0,
        paused: false,
        ended: false,
        muted: false,
        srcObject: {}
      }
    }
  }),
  resetEmotionDebug: jest.fn(),
  updatePerformanceMetrics: jest.fn(),
  logDetectionStart: jest.fn(),
  logDetectionSuccess: jest.fn(),
  logDetectionFailure: jest.fn()
}));

jest.mock('@/utils/renderMonitor', () => ({
  useRenderTracker: jest.fn()
}));

jest.mock('./EmotionDebugPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="emotion-debug-panel">Debug Panel</div>
}));

// Test wrapper component with context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EmotionContextProvider>
    {children}
  </EmotionContextProvider>
);

describe('EmotionDetector Integration', () => {
  const mockVideoElement = document.createElement('video') as HTMLVideoElement;
  const mockOnError = jest.fn();

  // Set up video element properties
  Object.defineProperty(mockVideoElement, 'videoWidth', { value: 640, writable: true });
  Object.defineProperty(mockVideoElement, 'videoHeight', { value: 480, writable: true });
  Object.defineProperty(mockVideoElement, 'readyState', { value: 4, writable: true });
  Object.defineProperty(mockVideoElement, 'currentTime', { value: 1.0, writable: true });
  Object.defineProperty(mockVideoElement, 'paused', { value: false, writable: true });
  Object.defineProperty(mockVideoElement, 'ended', { value: false, writable: true });

  const defaultProps = {
    videoElement: mockVideoElement,
    onError: mockOnError,
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadEmotionModels.mockResolvedValue(undefined);
    mockAreModelsLoaded.mockReturnValue(true);
    mockDetectEmotions.mockResolvedValue({
      dominant: 'happy',
      confidence: 0.8,
      emotions: {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.03,
        neutral: 0.02,
        fearful: 0.0,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    });
  });

  it('should successfully initialize and start emotion detection', async () => {
    const { container } = render(
      <TestWrapper>
        <EmotionDetector {...defaultProps} />
      </TestWrapper>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(container.querySelector('.emotion-detector')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify models were loaded
    expect(mockLoadEmotionModels).toHaveBeenCalled();
    expect(mockAreModelsLoaded).toHaveBeenCalled();
  });

  it('should handle model loading failure gracefully', async () => {
    mockLoadEmotionModels.mockRejectedValue(new Error('Model loading failed'));
    mockAreModelsLoaded.mockReturnValue(false);

    render(
      <TestWrapper>
        <EmotionDetector {...defaultProps} />
      </TestWrapper>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    }, { timeout: 2000 });

    const errorCall = mockOnError.mock.calls[0][0];
    expect(errorCall.message).toContain('Model loading error');
  });

  it('should show loading state initially', () => {
    mockAreModelsLoaded.mockReturnValue(false);

    render(
      <TestWrapper>
        <EmotionDetector {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading emotion detection models...')).toBeInTheDocument();
  });

  it('should render debug panel in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { container } = render(
      <TestWrapper>
        <EmotionDetector {...defaultProps} />
      </TestWrapper>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(container.querySelector('.emotion-detector')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check for debug panel (EmotionDebugPanel component should be rendered)
    expect(container.querySelector('.emotion-detector')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});