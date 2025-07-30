"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WebcamState, WebcamError } from '@/types';

interface WebcamCaptureProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: WebcamError) => void;
  className?: string;
  width?: number;
  height?: number;
  autoStart?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onStreamReady,
  onError,
  className = '',
  width = 320,
  height = 240,
  autoStart = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [webcamState, setWebcamState] = useState<WebcamState>({
    isActive: false,
    hasPermission: null,
    error: null,
    stream: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const mapMediaError = useCallback((error: DOMException): WebcamError => {
    switch (error.name) {
      case 'NotAllowedError':
        return {
          type: 'permission_denied',
          message: 'Camera access was denied. Please allow camera access to use this feature.'
        };
      case 'NotFoundError':
        return {
          type: 'not_found',
          message: 'No camera device found. Please connect a camera and try again.'
        };
      case 'NotReadableError':
        return {
          type: 'not_readable',
          message: 'Camera is already in use by another application.'
        };
      case 'OverconstrainedError':
        return {
          type: 'overconstrained',
          message: 'Camera does not support the requested settings.'
        };
      default:
        return {
          type: 'unknown',
          message: `Camera error: ${error.message || 'Unknown error occurred'}`
        };
    }
  }, []);

  const startWebcam = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error: WebcamError = {
          type: 'unknown',
          message: 'Camera access is not supported in this browser.'
        };
        setWebcamState(prev => ({ ...prev, error, hasPermission: false }));
        onError?.(error);
        setIsLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
      setWebcamState({
        isActive: true,
        hasPermission: true,
        error: null,
        stream
      });

      onStreamReady?.(stream);
    } catch (err) {
      const error = mapMediaError(err as DOMException);
      setWebcamState(prev => ({
        ...prev,
        isActive: false,
        hasPermission: false,
        error
      }));
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [width, height, mapMediaError, onStreamReady, onError]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setWebcamState({
      isActive: false,
      hasPermission: null,
      error: null,
      stream: null
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (autoStart) {
      startWebcam();
    }

    return () => {
      // Cleanup function using ref to ensure stream is stopped
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Copy ref to variable to avoid stale closure warning
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [autoStart, startWebcam]);

  const handleRetry = () => {
    setWebcamState(prev => ({ ...prev, error: null }));
    startWebcam();
  };

  return (
    <div className={`webcam-capture ${className}`}>
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={width}
          height={height}
          className={`rounded-lg shadow-md ${
            webcamState.isActive ? 'block' : 'hidden'
          }`}
          style={{ transform: 'scaleX(-1)' }} // Mirror the video
        />
        
        {/* Loading state */}
        {isLoading && !webcamState.error && (
          <div 
            className="flex items-center justify-center bg-gray-200 rounded-lg shadow-md"
            style={{ width, height }}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {webcamState.error && (
          <div 
            className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg shadow-md"
            style={{ width, height }}
          >
            <div className="text-center p-4">
              <div className="text-red-500 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 mb-3">{webcamState.error.message}</p>
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex justify-center space-x-2">
        {webcamState.isActive ? (
          <button
            onClick={stopWebcam}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Stop Camera
          </button>
        ) : (
          !webcamState.error && !isLoading && (
            <button
              onClick={startWebcam}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Start Camera
            </button>
          )
        )}
      </div>
    </div>
  );
};