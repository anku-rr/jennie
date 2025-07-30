"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEmotionContext } from "@/contexts/EmotionContext";
import {
  loadEmotionModels,
  detectEmotions,
  areModelsLoaded,
  AdaptiveFrameRate,
  EmotionDetectionError,
} from "@/utils/emotionDetection";
import { 
  isVideoElementReady, 
  getVideoStatusDescription 
} from "@/utils/videoValidation";
import { usePerformanceMonitor } from "@/utils/performanceMonitor";
import { useRenderTracker } from "@/utils/renderMonitor";
import { 
  logVideoStatus, 
  updatePerformanceMetrics, 
  resetEmotionDebug 
} from "@/utils/emotionDebug";
import EmotionDebugPanel from "./EmotionDebugPanel";

interface EmotionDetectorProps {
  videoElement: HTMLVideoElement | null;
  onError: (error: EmotionDetectionError) => void;
  isActive: boolean;
  className?: string;
}

export const EmotionDetector: React.FC<EmotionDetectorProps> = ({
  videoElement,
  onError,
  isActive,
  className = "",
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Track renders for performance monitoring
  useRenderTracker('EmotionDetector', { 
    hasVideo: !!videoElement,
    isActive,
    isInitialized 
  });

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameRateManager = useRef(new AdaptiveFrameRate());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { updateEmotion, setEmotionDetectionActive } = useEmotionContext();
  const { recordEmotionDetection, isPerformanceDegraded, logPerformanceWarnings } =
    usePerformanceMonitor();

  // Component-level cleanup flag to ensure clean unmounting
  const isUnmountedRef = useRef(false);

  // Store functions in refs to prevent useEffect from re-running
  const updateEmotionRef = useRef(updateEmotion);
  const setEmotionDetectionActiveRef = useRef(setEmotionDetectionActive);
  const recordEmotionDetectionRef = useRef(recordEmotionDetection);
  const isPerformanceDegradedRef = useRef(isPerformanceDegraded);
  const logPerformanceWarningsRef = useRef(logPerformanceWarnings);
  const onErrorRef = useRef(onError);

  // Update refs when functions change - use useEffect to avoid updates on every render
  useEffect(() => {
    updateEmotionRef.current = updateEmotion;
  }, [updateEmotion]);

  useEffect(() => {
    setEmotionDetectionActiveRef.current = setEmotionDetectionActive;
  }, [setEmotionDetectionActive]);

  useEffect(() => {
    recordEmotionDetectionRef.current = recordEmotionDetection;
  }, [recordEmotionDetection]);

  useEffect(() => {
    isPerformanceDegradedRef.current = isPerformanceDegraded;
  }, [isPerformanceDegraded]);

  useEffect(() => {
    logPerformanceWarningsRef.current = logPerformanceWarnings;
  }, [logPerformanceWarnings]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize emotion detection models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        console.log('[EmotionDetector] Starting model initialization...');
        
        // Check if models are already loaded and verified
        if (areModelsLoaded()) {
          console.log('[EmotionDetector] Models already marked as loaded, verifying...');
          const { areModelsLoadedAndVerified } = await import('@/utils/emotionDetection');
          const verified = await areModelsLoadedAndVerified();
          if (verified) {
            console.log('[EmotionDetector] Models verified successfully');
            setIsInitialized(true);
            return;
          } else {
            console.warn('[EmotionDetector] Model verification failed, reloading...');
          }
        }

        console.log('[EmotionDetector] Loading emotion detection models...');
        // Load models with comprehensive error handling and retry logic
        await loadEmotionModels();
        console.log('[EmotionDetector] Models loaded successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('[EmotionDetector] Model initialization failed:', error);
        
        // Create detailed error message based on the error type
        let errorMessage = "Failed to load emotion detection models";
        let errorType: "model_load_failed" = "model_load_failed";
        
        if (error instanceof EmotionDetectionError) {
          errorMessage = error.message;
          errorType = error.type as "model_load_failed";
        } else if (error instanceof Error) {
          errorMessage = `Model loading error: ${error.message}`;
        }
        
        const emotionError = new EmotionDetectionError(errorMessage, errorType);
        onErrorRef.current(emotionError);
      }
    };

    // Reset debug info when component initializes
    resetEmotionDebug();
    initializeModels();
  }, []); // Remove onError dependency and use ref instead

  // Main detection loop - completely isolated from React state
  useEffect(() => {
    if (!isActive || !videoElement || !isInitialized) {
      setEmotionDetectionActiveRef.current(false);
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    setEmotionDetectionActiveRef.current(true);
    
    // Isolation: Create a cleanup controller that's completely isolated from React render cycle
    const cleanupController = {
      shouldContinue: true,
      isCurrentlyProcessing: false,
      timeoutId: null as NodeJS.Timeout | null,
      
      // Method to safely stop the detection loop
      stop: function() {
        this.shouldContinue = false;
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
      },
      
      // Method to check if we should continue processing
      canContinue: function() {
        return this.shouldContinue && !this.isCurrentlyProcessing;
      }
    };

    const processFrame = async () => {
      // Early exit if cleanup has been triggered or component is unmounted
      if (!cleanupController.canContinue() || !videoElement || isUnmountedRef.current) {
        console.log('[EmotionDetector] Stopping processFrame - cleanup triggered or unmounted');
        return;
      }

      // Log video status before processing
      const videoStatus = logVideoStatus(videoElement);

      // Validate video element before processing
      if (!isVideoElementReady(videoElement)) {
        const statusDescription = getVideoStatusDescription(videoElement);
        console.warn('[EmotionDetector] Video not ready for processing:', statusDescription);
        console.warn('[EmotionDetector] Video status details:', {
          readyState: videoElement.readyState,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          currentTime: videoElement.currentTime,
          paused: videoElement.paused,
          ended: videoElement.ended
        });
        
        // Schedule next check with shorter interval when video is not ready
        if (cleanupController.shouldContinue && !isUnmountedRef.current) {
          cleanupController.timeoutId = setTimeout(processFrame, 500); // Check again in 500ms
        }
        return;
      }

      console.log('[EmotionDetector] Video ready, processing frame...');

      cleanupController.isCurrentlyProcessing = true;
      const startTime = performance.now();

      try {
        const emotionData = await detectEmotions(videoElement);

        // Double-check we should still continue after async operation and component is still mounted
        if (emotionData && cleanupController.shouldContinue && !isUnmountedRef.current) {
          updateEmotionRef.current(emotionData);
        }
      } catch (err) {
        // Only handle errors if we haven't been cleaned up and component is still mounted
        if (cleanupController.shouldContinue && !isUnmountedRef.current) {
          const emotionError = new EmotionDetectionError(
            "Failed to detect emotions",
            "detection_failed"
          );
          onErrorRef.current(emotionError);
        }
      } finally {
        const processingTime = performance.now() - startTime;

        // Only continue with performance tracking if we haven't been cleaned up and component is still mounted
        if (cleanupController.shouldContinue && !isUnmountedRef.current) {
          // Update adaptive frame rate and get metrics
          frameRateManager.current.getOptimalInterval(processingTime);
          const metrics = frameRateManager.current.getPerformanceMetrics();

          // Update debug performance metrics
          updatePerformanceMetrics(metrics);

          // Record performance metrics
          recordEmotionDetectionRef.current(
            processingTime,
            metrics.fps,
            metrics.avgCpuUsage,
            metrics.frameDropRate
          );

          // Check for performance degradation and log detailed warnings
          if (isPerformanceDegradedRef.current()) {
            logPerformanceWarningsRef.current();
          }
        }

        cleanupController.isCurrentlyProcessing = false;

        // Schedule next detection with adaptive interval, but only if we should continue and component is still mounted
        if (cleanupController.shouldContinue && videoElement && !isUnmountedRef.current) {
          const nextInterval = frameRateManager.current.getOptimalInterval(processingTime);
          cleanupController.timeoutId = setTimeout(processFrame, nextInterval);
        }
      }
    };

    // Clear any existing interval before starting
    if (detectionIntervalRef.current) {
      clearTimeout(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Reset frame rate manager for clean start
    frameRateManager.current.reset();

    // Start processing
    processFrame();

    // Cleanup function with comprehensive cleanup
    return () => {
      // Stop the detection loop immediately
      cleanupController.stop();
      
      // Update context state
      setEmotionDetectionActiveRef.current(false);
      
      // Clear any remaining timeouts (double cleanup for safety)
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      
      // Clear the cleanup controller's timeout as well
      if (cleanupController.timeoutId) {
        clearTimeout(cleanupController.timeoutId);
        cleanupController.timeoutId = null;
      }
      
      // Reset frame rate manager to clean state
      frameRateManager.current.reset();
    };
  }, [isActive, videoElement, isInitialized]);

  // Component unmount cleanup - ensures all resources are cleaned up when component is destroyed
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isUnmountedRef.current = true;
      
      // Force cleanup of any remaining detection processes
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      
      // Cleanup frame rate manager to prevent memory leaks
      frameRateManager.current.cleanup();
      
      // Ensure emotion detection is marked as inactive
      setEmotionDetectionActiveRef.current(false);
    };
  }, []); // Empty dependency array - only runs on unmount

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-sm text-gray-600">
          Loading emotion detection models...
        </div>
      </div>
    );
  }

  return (
    <div className={`emotion-detector ${className}`}>
      {/* Hidden canvas for processing (if needed for future optimizations) */}
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width={320}
        height={240}
      />

      {/* Debug panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <EmotionDebugPanel isVisible={true} />
      )}
    </div>
  );
};

export default EmotionDetector;
