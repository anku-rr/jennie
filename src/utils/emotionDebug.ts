/**
 * Comprehensive debugging utilities for emotion detection pipeline
 * Provides detailed logging and monitoring for development and troubleshooting
 */

import { EmotionData } from '../types';
import { 
  validateVideoElement, 
  getVideoElementStatus, 
  getVideoStatusDescription,
  VideoElementStatus as VideoValidationStatus,
  VideoValidationResult 
} from './videoValidation';

export interface VideoElementStatus extends VideoValidationStatus {
  volume: number;
  playbackRate: number;
  networkState: number;
  error: string | null;
  validationResult: VideoValidationResult;
}

export interface ModelLoadingStatus {
  tinyFaceDetector: boolean;
  faceExpressionNet: boolean;
  isLoading: boolean;
  loadingStartTime: number | null;
  loadingDuration: number | null;
  lastError: string | null;
  retryCount: number;
  maxRetries: number;
}

export interface EmotionDebugInfo {
  isVideoReady: boolean;
  videoStatus: VideoElementStatus;
  modelsLoaded: boolean;
  modelStatus: ModelLoadingStatus;
  lastDetectionTime: string | null;
  detectionErrors: string[];
  apiContextSent: boolean;
  detectionCount: number;
  successfulDetections: number;
  failedDetections: number;
  averageProcessingTime: number;
  lastEmotionData: EmotionData | null;
  performanceMetrics: {
    fps: number;
    avgCpuUsage: number;
    frameDropRate: number;
    memoryUsage: number;
  };
}

/**
 * Debug logger class for emotion detection pipeline
 */
export class EmotionDebugLogger {
  private static instance: EmotionDebugLogger;
  private debugInfo: EmotionDebugInfo;
  private processingTimes: number[] = [];
  private maxProcessingTimeHistory = 20;
  private isDebugMode: boolean;

  private constructor() {
    this.isDebugMode = process.env.NODE_ENV === 'development';
    this.debugInfo = this.initializeDebugInfo();
  }

  public static getInstance(): EmotionDebugLogger {
    if (!EmotionDebugLogger.instance) {
      EmotionDebugLogger.instance = new EmotionDebugLogger();
    }
    return EmotionDebugLogger.instance;
  }

  private initializeDebugInfo(): EmotionDebugInfo {
    return {
      isVideoReady: false,
      videoStatus: {
        isConnected: false,
        isPlaying: false,
        hasValidDimensions: false,
        readyState: 0,
        currentTime: 0,
        videoWidth: 0,
        videoHeight: 0,
        duration: 0,
        paused: true,
        ended: false,
        muted: false,
        srcObject: null,
        volume: 1,
        playbackRate: 1,
        networkState: 0,
        error: null,
        validationResult: {
          isValid: false,
          isReady: false,
          errors: [],
          warnings: [],
          status: {
            isConnected: false,
            isPlaying: false,
            hasValidDimensions: false,
            readyState: 0,
            currentTime: 0,
            videoWidth: 0,
            videoHeight: 0,
            duration: 0,
            paused: true,
            ended: false,
            muted: false,
            srcObject: null,
          },
        },
      },
      modelsLoaded: false,
      modelStatus: {
        tinyFaceDetector: false,
        faceExpressionNet: false,
        isLoading: false,
        loadingStartTime: null,
        loadingDuration: null,
        lastError: null,
        retryCount: 0,
        maxRetries: 3,
      },
      lastDetectionTime: null,
      detectionErrors: [],
      apiContextSent: false,
      detectionCount: 0,
      successfulDetections: 0,
      failedDetections: 0,
      averageProcessingTime: 0,
      lastEmotionData: null,
      performanceMetrics: {
        fps: 0,
        avgCpuUsage: 0,
        frameDropRate: 0,
        memoryUsage: 0,
      },
    };
  }

  /**
   * Log video element status and validation
   */
  public logVideoElementStatus(videoElement: HTMLVideoElement | null): VideoElementStatus {
    // Get comprehensive validation result
    const validationResult = validateVideoElement(videoElement);
    const baseStatus = getVideoElementStatus(videoElement);
    
    // Extend with additional debug information
    const status: VideoElementStatus = {
      ...baseStatus,
      volume: videoElement?.volume || 1,
      playbackRate: videoElement?.playbackRate || 1,
      networkState: videoElement?.networkState || 0,
      error: videoElement?.error ? videoElement.error.message : null,
      validationResult,
    };

    this.debugInfo.videoStatus = status;
    this.debugInfo.isVideoReady = validationResult.isReady;

    if (this.isDebugMode) {
      console.log('[EmotionDebug] Video Element Status:', {
        connected: status.isConnected,
        playing: status.isPlaying,
        dimensions: `${status.videoWidth}x${status.videoHeight}`,
        readyState: this.getReadyStateDescription(status.readyState),
        currentTime: status.currentTime.toFixed(2),
        paused: status.paused,
        isValid: validationResult.isValid,
        isReady: validationResult.isReady,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        description: getVideoStatusDescription(videoElement),
      });

      // Log validation errors and warnings separately for clarity
      if (validationResult.errors.length > 0) {
        console.error('[EmotionDebug] Video validation errors:', validationResult.errors);
      }
      if (validationResult.warnings.length > 0) {
        console.warn('[EmotionDebug] Video validation warnings:', validationResult.warnings);
      }
    }

    return status;
  }

  /**
   * Log model loading progress and status
   */
  public logModelLoadingStart(): void {
    this.debugInfo.modelStatus.isLoading = true;
    this.debugInfo.modelStatus.loadingStartTime = Date.now();
    this.debugInfo.modelStatus.lastError = null;
    this.debugInfo.modelStatus.retryCount++;

    if (this.isDebugMode) {
      console.log(`[EmotionDebug] Model loading started (attempt ${this.debugInfo.modelStatus.retryCount}/${this.debugInfo.modelStatus.maxRetries})`);
    }
  }

  public logModelLoadingComplete(success: boolean, error?: string): void {
    const now = Date.now();
    this.debugInfo.modelStatus.isLoading = false;
    
    if (this.debugInfo.modelStatus.loadingStartTime) {
      this.debugInfo.modelStatus.loadingDuration = now - this.debugInfo.modelStatus.loadingStartTime;
    }

    if (success) {
      this.debugInfo.modelsLoaded = true;
      this.debugInfo.modelStatus.tinyFaceDetector = true;
      this.debugInfo.modelStatus.faceExpressionNet = true;
      
      if (this.isDebugMode) {
        console.log('[EmotionDebug] Models loaded successfully in', 
          this.debugInfo.modelStatus.loadingDuration, 'ms');
      }
    } else {
      this.debugInfo.modelStatus.lastError = error || 'Unknown error';
      
      if (this.isDebugMode) {
        console.error(`[EmotionDebug] Model loading failed (attempt ${this.debugInfo.modelStatus.retryCount}/${this.debugInfo.modelStatus.maxRetries}):`, error);
      }
    }
  }

  /**
   * Update model loading status from external source
   */
  public updateModelLoadingStatus(status: ModelLoadingStatus): void {
    this.debugInfo.modelStatus = { ...status };
    this.debugInfo.modelsLoaded = status.tinyFaceDetector && status.faceExpressionNet;

    if (this.isDebugMode) {
      console.log('[EmotionDebug] Model status updated:', {
        tinyFaceDetector: status.tinyFaceDetector,
        faceExpressionNet: status.faceExpressionNet,
        isLoading: status.isLoading,
        retryCount: status.retryCount,
        lastError: status.lastError,
      });
    }
  }

  /**
   * Log model loading retry attempt
   */
  public logModelLoadingRetry(retryCount: number, maxRetries: number, delay: number): void {
    this.debugInfo.modelStatus.retryCount = retryCount;
    
    if (this.isDebugMode) {
      console.warn(`[EmotionDebug] Model loading retry ${retryCount}/${maxRetries} in ${delay}ms`);
    }
  }

  /**
   * Log emotion detection attempt
   */
  public logDetectionStart(): void {
    this.debugInfo.detectionCount++;
    
    if (this.isDebugMode) {
      console.log(`[EmotionDebug] Detection attempt #${this.debugInfo.detectionCount}`);
    }
  }

  /**
   * Log successful emotion detection
   */
  public logDetectionSuccess(emotionData: EmotionData, processingTime: number): void {
    this.debugInfo.successfulDetections++;
    this.debugInfo.lastDetectionTime = new Date().toISOString();
    this.debugInfo.lastEmotionData = emotionData;
    
    // Track processing times
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxProcessingTimeHistory) {
      this.processingTimes.shift();
    }
    
    this.debugInfo.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;

    if (this.isDebugMode) {
      console.log('[EmotionDebug] Detection successful:', {
        dominant: emotionData.dominant,
        confidence: (emotionData.confidence * 100).toFixed(1) + '%',
        processingTime: processingTime.toFixed(1) + 'ms',
        avgProcessingTime: this.debugInfo.averageProcessingTime.toFixed(1) + 'ms',
        successRate: ((this.debugInfo.successfulDetections / this.debugInfo.detectionCount) * 100).toFixed(1) + '%',
      });
    }
  }

  /**
   * Log failed emotion detection
   */
  public logDetectionFailure(error: string): void {
    this.debugInfo.failedDetections++;
    this.debugInfo.detectionErrors.push(`${new Date().toISOString()}: ${error}`);
    
    // Keep only last 10 errors
    if (this.debugInfo.detectionErrors.length > 10) {
      this.debugInfo.detectionErrors.shift();
    }

    if (this.isDebugMode) {
      console.error('[EmotionDebug] Detection failed:', {
        error,
        failureRate: ((this.debugInfo.failedDetections / this.debugInfo.detectionCount) * 100).toFixed(1) + '%',
        totalAttempts: this.debugInfo.detectionCount,
      });
    }
  }

  /**
   * Log API context sending
   */
  public logApiContextSent(emotionContext: EmotionData | undefined): void {
    this.debugInfo.apiContextSent = !!emotionContext;

    if (this.isDebugMode) {
      if (emotionContext) {
        console.log('[EmotionDebug] Emotion context sent to API:', {
          dominant: emotionContext.dominant,
          confidence: (emotionContext.confidence * 100).toFixed(1) + '%',
          timestamp: emotionContext.timestamp,
        });
      } else {
        console.warn('[EmotionDebug] No emotion context sent to API');
      }
    }
  }

  /**
   * Update performance metrics
   */
  public updatePerformanceMetrics(metrics: {
    fps: number;
    avgCpuUsage: number;
    frameDropRate: number;
  }): void {
    this.debugInfo.performanceMetrics = {
      ...metrics,
      memoryUsage: this.getMemoryUsage(),
    };

    if (this.isDebugMode && this.debugInfo.detectionCount % 20 === 0) {
      console.log('[EmotionDebug] Performance metrics:', {
        fps: metrics.fps.toFixed(1),
        cpuUsage: metrics.avgCpuUsage.toFixed(1) + '%',
        frameDropRate: (metrics.frameDropRate * 100).toFixed(1) + '%',
        memoryUsage: this.debugInfo.performanceMetrics.memoryUsage.toFixed(1) + 'MB',
      });
    }
  }

  /**
   * Get current debug information
   */
  public getDebugInfo(): EmotionDebugInfo {
    return { ...this.debugInfo };
  }

  /**
   * Reset debug information
   */
  public reset(): void {
    this.debugInfo = this.initializeDebugInfo();
    this.processingTimes = [];
    
    if (this.isDebugMode) {
      console.log('[EmotionDebug] Debug info reset');
    }
  }

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  /**
   * Get human-readable ready state description
   */
  private getReadyStateDescription(readyState: number): string {
    switch (readyState) {
      case 0: return 'HAVE_NOTHING';
      case 1: return 'HAVE_METADATA';
      case 2: return 'HAVE_CURRENT_DATA';
      case 3: return 'HAVE_FUTURE_DATA';
      case 4: return 'HAVE_ENOUGH_DATA';
      default: return `UNKNOWN(${readyState})`;
    }
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }
}

/**
 * Convenience functions for logging
 */
export const emotionDebugLogger = EmotionDebugLogger.getInstance();

export function logVideoStatus(videoElement: HTMLVideoElement | null): VideoElementStatus {
  return emotionDebugLogger.logVideoElementStatus(videoElement);
}

export function logModelLoadingStart(): void {
  emotionDebugLogger.logModelLoadingStart();
}

export function logModelLoadingComplete(success: boolean, error?: string): void {
  emotionDebugLogger.logModelLoadingComplete(success, error);
}

export function logDetectionStart(): void {
  emotionDebugLogger.logDetectionStart();
}

export function logDetectionSuccess(emotionData: EmotionData, processingTime: number): void {
  emotionDebugLogger.logDetectionSuccess(emotionData, processingTime);
}

export function logDetectionFailure(error: string): void {
  emotionDebugLogger.logDetectionFailure(error);
}

export function logApiContextSent(emotionContext: EmotionData | undefined): void {
  emotionDebugLogger.logApiContextSent(emotionContext);
}

export function updatePerformanceMetrics(metrics: {
  fps: number;
  avgCpuUsage: number;
  frameDropRate: number;
}): void {
  emotionDebugLogger.updatePerformanceMetrics(metrics);
}

export function getEmotionDebugInfo(): EmotionDebugInfo {
  return emotionDebugLogger.getDebugInfo();
}

export function resetEmotionDebug(): void {
  emotionDebugLogger.reset();
}

export function updateModelLoadingStatus(status: ModelLoadingStatus): void {
  emotionDebugLogger.updateModelLoadingStatus(status);
}

export function logModelLoadingRetry(retryCount: number, maxRetries: number, delay: number): void {
  emotionDebugLogger.logModelLoadingRetry(retryCount, maxRetries, delay);
}