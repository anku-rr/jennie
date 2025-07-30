'use client';

import React, { Suspense, lazy } from 'react';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { EmotionDetectionError } from '@/utils/emotionDetection';

// Lazy load the EmotionDetector component for code splitting
const EmotionDetectorComponent = lazy(() => 
  import('./EmotionDetector').then(module => ({ default: module.EmotionDetector }))
);

interface EmotionDetectorLazyProps {
  videoElement: HTMLVideoElement | null;
  onError: (error: EmotionDetectionError) => void;
  isActive: boolean;
  className?: string;
}

/**
 * Lazy-loaded wrapper for EmotionDetector to enable code splitting
 * This reduces the initial bundle size by loading emotion detection only when needed
 */
export const EmotionDetectorLazy: React.FC<EmotionDetectorLazyProps> = (props) => {
  return (
    <Suspense 
      fallback={
        <div className={`flex items-center justify-center p-4 ${props.className || ''}`}>
          <LoadingIndicator 
            message="Loading emotion detection..." 
            size="small"
            variant="dots"
          />
        </div>
      }
    >
      <EmotionDetectorComponent {...props} />
    </Suspense>
  );
};

export default EmotionDetectorLazy;