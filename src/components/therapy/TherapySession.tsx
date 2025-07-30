'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, CircularProgress, Paper, Typography, Box } from '@mui/material';
import { ChatInterface } from './ChatInterface';
import { JennieAvatar } from './JennieAvatar';
import { WebcamCapture } from '@/components/webcam/WebcamCapture';
import { EmotionDetectorLazy } from '@/components/emotion/EmotionDetectorLazy';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { FeatureUnavailable, ProgressiveFallback } from '@/components/common/GracefulDegradation';
import { useSession } from '@/contexts/SessionContext';
import { useEmotionContext } from '@/contexts/EmotionContext';
import { WebcamError } from '@/types';
import { EmotionDetectionError } from '@/utils/emotionDetection';
import { AppError, ErrorHandler } from '@/lib/errorHandling';

interface TherapySessionProps {
  className?: string;
}

export const TherapySession: React.FC<TherapySessionProps> = ({
  className = ''
}) => {
  // State management
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isEmotionDetectionEnabled, setIsEmotionDetectionEnabled] = useState(false);
  const [webcamError, setWebcamError] = useState<AppError | null>(null);
  const [emotionError, setEmotionError] = useState<AppError | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [retryAttempts, setRetryAttempts] = useState({ webcam: 0, emotion: 0 });
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Contexts
  const { session } = useSession();
  const { currentEmotion, isEmotionDetectionActive } = useEmotionContext();

  // Initialize session on mount
  useEffect(() => {
    // Simulate initialization delay for better UX
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle webcam stream ready
  const handleWebcamReady = useCallback((stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      
      // Wait for video metadata to load before setting as ready for emotion detection
      const handleLoadedMetadata = () => {
        console.log('[TherapySession] Video metadata loaded, setting up emotion detection');
        console.log('[TherapySession] Video dimensions:', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          readyState: videoRef.current?.readyState
        });
        
        setVideoElement(videoRef.current);
        // Auto-enable emotion detection when webcam is ready
        setIsEmotionDetectionEnabled(true);
        setWebcamError(null);
      };

      // Add event listener for when video metadata is loaded
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      
      // Also try to play the video to ensure it's ready
      videoRef.current.play().catch(error => {
        console.warn('[TherapySession] Video play failed:', error);
      });
    }
  }, []);

  // Handle webcam errors
  const handleWebcamError = useCallback((error: WebcamError) => {
    const appError = ErrorHandler.fromWebcamError(error);
    ErrorHandler.logError(appError, 'TherapySession.webcam');
    setWebcamError(appError);
    setVideoElement(null);
    setIsEmotionDetectionEnabled(false);
  }, []);

  // Handle emotion detection errors
  const handleEmotionError = useCallback((error: EmotionDetectionError) => {
    const appError = ErrorHandler.fromEmotionError(error);
    ErrorHandler.logError(appError, 'TherapySession.emotion');
    setEmotionError(appError);
    // Continue without emotion detection on error
  }, []);

  // Retry webcam
  const retryWebcam = useCallback(() => {
    if (retryAttempts.webcam >= 3) return; // Max 3 retries
    
    setRetryAttempts(prev => ({ ...prev, webcam: prev.webcam + 1 }));
    setWebcamError(null);
    // WebcamCapture component will automatically retry when error is cleared
  }, [retryAttempts.webcam]);

  // Retry emotion detection
  const retryEmotion = useCallback(() => {
    if (retryAttempts.emotion >= 3) return; // Max 3 retries
    
    setRetryAttempts(prev => ({ ...prev, emotion: prev.emotion + 1 }));
    setEmotionError(null);
    // EmotionDetector will automatically retry when error is cleared
  }, [retryAttempts.emotion]);

  // Clear webcam error
  const clearWebcamError = useCallback(() => {
    setWebcamError(null);
  }, []);

  // Clear emotion error
  const clearEmotionError = useCallback(() => {
    setEmotionError(null);
  }, []);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className={`therapy-session-loading ${className}`}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Paper elevation={3} className="p-8 text-center">
            <LoadingIndicator 
              message="Preparing your therapy session..."
              size="large"
              variant="circular"
            />
            <Typography variant="body2" className="text-gray-500 mt-4">
              Setting up secure environment
            </Typography>
          </Paper>
        </div>
      </div>
    );
  }

  // Main therapy session interface
  return (
    <div className={`therapy-session ${className}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header with Jennie Avatar */}
          <header className="mb-6">
            <div className="text-center mb-6">
              <Typography 
                variant="h3" 
                component="h1" 
                className="font-bold text-gray-800 mb-2 text-2xl sm:text-3xl lg:text-4xl"
              >
                AI Therapy Session
              </Typography>
              <Typography 
                variant="body1" 
                className="text-gray-600 text-sm sm:text-base"
              >
                A safe, private space for therapeutic conversations
              </Typography>
            </div>
            
            {/* Show Jennie Avatar only when no messages yet */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-md">
                <JennieAvatar showIntroduction={true} />
              </div>
            </div>
          </header>

          {/* Error Displays */}
          {webcamError && (() => {
            const webcamErrorProps: any = {
              error: webcamError,
              onDismiss: clearWebcamError,
              variant: "banner",
              className: "mb-4"
            };
            
            if (webcamError.retryable && retryAttempts.webcam < 3) {
              webcamErrorProps.onRetry = retryWebcam;
            }
            
            return <ErrorDisplay {...webcamErrorProps} />;
          })()}

          {emotionError && (() => {
            const emotionErrorProps: any = {
              error: emotionError,
              onDismiss: clearEmotionError,
              variant: "banner",
              className: "mb-4"
            };
            
            if (emotionError.retryable && retryAttempts.emotion < 3) {
              emotionErrorProps.onRetry = retryEmotion;
            }
            
            return <ErrorDisplay {...emotionErrorProps} />;
          })()}

          {/* Main Content Area */}
          <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Webcam and Emotion Detection Panel */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Paper elevation={2} className="p-4 bg-white rounded-lg h-fit">
                <Typography 
                  variant="h6" 
                  className="text-gray-800 mb-4 text-center font-semibold"
                >
                  Video & Emotion Detection
                </Typography>
                
                {/* Webcam Component with Graceful Degradation */}
                <div className="mb-4">
                  {(() => {
                    const webcamFallbackProps: any = {
                      condition: !webcamError,
                      feature: "webcam",
                      fallback: (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <Typography variant="body2" className="text-gray-600">
                            Text-only conversation mode
                          </Typography>
                        </div>
                      )
                    };
                    
                    if (webcamError?.message) {
                      webcamFallbackProps.reason = webcamError.message;
                    }
                    
                    if (webcamError?.retryable && retryAttempts.webcam < 3) {
                      webcamFallbackProps.onRetry = retryWebcam;
                    }
                    
                    return (
                      <ProgressiveFallback {...webcamFallbackProps}>
                        <WebcamCapture
                          onStreamReady={handleWebcamReady}
                          onError={handleWebcamError}
                          width={280}
                          height={210}
                          autoStart={true}
                          className="w-full"
                        />
                        
                        {/* Hidden video element for emotion detection */}
                        <video
                          ref={videoRef}
                          style={{ display: 'none' }}
                          autoPlay
                          playsInline
                          muted
                          onLoadedMetadata={() => {
                            console.log('[TherapySession] Hidden video metadata loaded');
                          }}
                          onCanPlay={() => {
                            console.log('[TherapySession] Hidden video can play');
                          }}
                          onError={(e) => {
                            console.error('[TherapySession] Hidden video error:', e);
                          }}
                        />
                        
                        {/* Emotion Detection Component with Graceful Degradation */}
                        {videoElement && (() => {
                          const emotionFallbackProps: any = {
                            condition: !emotionError,
                            feature: "emotion",
                            fallback: (
                              <div className="text-center p-2 bg-yellow-50 rounded text-xs">
                                <Typography variant="caption" className="text-yellow-700">
                                  Emotion detection unavailable
                                </Typography>
                              </div>
                            )
                          };
                          
                          if (emotionError?.message) {
                            emotionFallbackProps.reason = emotionError.message;
                          }
                          
                          if (emotionError?.retryable && retryAttempts.emotion < 3) {
                            emotionFallbackProps.onRetry = retryEmotion;
                          }
                          
                          return (
                            <ProgressiveFallback {...emotionFallbackProps}>
                              <EmotionDetectorLazy
                                videoElement={videoElement}
                                onError={handleEmotionError}
                                isActive={isEmotionDetectionEnabled}
                                className="relative"
                              />
                            </ProgressiveFallback>
                          );
                        })()}
                      </ProgressiveFallback>
                    );
                  })()}
                </div>

                {/* Emotion Status */}
                <div className="text-center">
                  <Typography variant="caption" className="text-gray-500 block mb-2">
                    Emotion detection helps Jennie understand your feelings better
                  </Typography>
                  
                  {isEmotionDetectionActive && currentEmotion && (
                    <Box className="p-3 bg-blue-50 rounded-lg">
                      <Typography variant="body2" className="text-blue-700 font-medium">
                        Current emotion: {currentEmotion.dominant}
                      </Typography>
                      <Typography variant="caption" className="text-blue-600">
                        Confidence: {Math.round(currentEmotion.confidence * 100)}%
                      </Typography>
                    </Box>
                  )}
                  
                  {!isEmotionDetectionActive && !webcamError && (
                    <Box className="p-3 bg-gray-50 rounded-lg">
                      <Typography variant="body2" className="text-gray-600">
                        Emotion detection inactive
                      </Typography>
                    </Box>
                  )}
                </div>
              </Paper>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Paper elevation={2} className="bg-white rounded-lg h-full">
                <div className="p-4 h-full">
                  <ChatInterface disabled={!session} />
                </div>
              </Paper>
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-8 text-center">
            <Typography variant="caption" className="text-gray-500">
              Your privacy is protected. Video processing happens locally on your device.
            </Typography>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TherapySession;