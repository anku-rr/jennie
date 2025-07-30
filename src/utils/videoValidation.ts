import { EmotionDetectionError } from './emotionDetection';

/**
 * Interface representing the status of a video element
 */
export interface VideoElementStatus {
  isConnected: boolean;
  isPlaying: boolean;
  hasValidDimensions: boolean;
  readyState: number;
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  muted: boolean;
  srcObject: MediaStream | null;
}

/**
 * Video element validation result
 */
export interface VideoValidationResult {
  isValid: boolean;
  isReady: boolean;
  errors: string[];
  warnings: string[];
  status: VideoElementStatus;
}

/**
 * Video ready states constants for better readability
 */
export const VIDEO_READY_STATES = {
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
} as const;

/**
 * Minimum video dimensions for emotion detection
 */
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 120;

/**
 * Get comprehensive status information about a video element
 */
export function getVideoElementStatus(videoElement: HTMLVideoElement | null): VideoElementStatus {
  if (!videoElement) {
    return {
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
    };
  }

  return {
    isConnected: videoElement.isConnected,
    isPlaying: !videoElement.paused && !videoElement.ended && videoElement.currentTime > 0,
    hasValidDimensions: videoElement.videoWidth >= MIN_VIDEO_WIDTH && videoElement.videoHeight >= MIN_VIDEO_HEIGHT,
    readyState: videoElement.readyState,
    currentTime: videoElement.currentTime,
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight,
    duration: videoElement.duration || 0,
    paused: videoElement.paused,
    ended: videoElement.ended,
    muted: videoElement.muted,
    srcObject: videoElement.srcObject as MediaStream | null,
  };
}

/**
 * Validate if a video element is ready for emotion detection processing
 */
export function validateVideoElement(videoElement: HTMLVideoElement | null): VideoValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get comprehensive status
  const status = getVideoElementStatus(videoElement);

  // Basic null check
  if (!videoElement) {
    errors.push('Video element is null or undefined');
    return {
      isValid: false,
      isReady: false,
      errors,
      warnings,
      status,
    };
  }

  // Check if video element is connected to DOM
  if (!status.isConnected) {
    errors.push('Video element is not connected to the DOM');
  }

  // Check video dimensions
  if (!status.hasValidDimensions) {
    if (status.videoWidth === 0 || status.videoHeight === 0) {
      errors.push('Video dimensions are not available (width: ' + status.videoWidth + ', height: ' + status.videoHeight + ')');
    } else if (status.videoWidth < MIN_VIDEO_WIDTH || status.videoHeight < MIN_VIDEO_HEIGHT) {
      warnings.push(`Video dimensions are below recommended minimum (${status.videoWidth}x${status.videoHeight}, recommended: ${MIN_VIDEO_WIDTH}x${MIN_VIDEO_HEIGHT})`);
    }
  }

  // Check ready state
  if (status.readyState < VIDEO_READY_STATES.HAVE_CURRENT_DATA) {
    const readyStateNames: Record<number, string> = {
      [VIDEO_READY_STATES.HAVE_NOTHING]: 'HAVE_NOTHING',
      [VIDEO_READY_STATES.HAVE_METADATA]: 'HAVE_METADATA',
      [VIDEO_READY_STATES.HAVE_CURRENT_DATA]: 'HAVE_CURRENT_DATA',
      [VIDEO_READY_STATES.HAVE_FUTURE_DATA]: 'HAVE_FUTURE_DATA',
      [VIDEO_READY_STATES.HAVE_ENOUGH_DATA]: 'HAVE_ENOUGH_DATA',
    };
    errors.push(`Video ready state insufficient for processing (current: ${readyStateNames[status.readyState] || status.readyState})`);
  }

  // Check if video is playing
  if (!status.isPlaying) {
    if (status.paused) {
      errors.push('Video is paused');
    } else if (status.ended) {
      errors.push('Video has ended');
    } else if (status.currentTime === 0) {
      errors.push('Video has not started playing (currentTime is 0)');
    } else {
      warnings.push('Video playback status is unclear');
    }
  }

  // Check for media stream (only in browser environment)
  if (!status.srcObject) {
    warnings.push('Video element has no srcObject (MediaStream)');
  } else if (typeof MediaStream !== 'undefined' && status.srcObject instanceof MediaStream) {
    const videoTracks = status.srcObject.getVideoTracks();
    if (videoTracks.length === 0) {
      errors.push('MediaStream has no video tracks');
    } else {
      const activeVideoTracks = videoTracks.filter(track => track.readyState === 'live');
      if (activeVideoTracks.length === 0) {
        errors.push('MediaStream has no active video tracks');
      }
    }
  } else if (status.srcObject && typeof MediaStream === 'undefined') {
    // In test environment, assume srcObject is valid if present
    warnings.push('MediaStream validation skipped (not in browser environment)');
  }

  // Check if video is muted (warning only, as this doesn't affect emotion detection)
  if (status.muted) {
    warnings.push('Video is muted (this does not affect emotion detection)');
  }

  const isValid = errors.length === 0;
  const isReady = isValid && status.readyState >= VIDEO_READY_STATES.HAVE_CURRENT_DATA && status.isPlaying;

  return {
    isValid,
    isReady,
    errors,
    warnings,
    status,
  };
}

/**
 * Check if video element is ready for processing (simplified version)
 */
export function isVideoElementReady(videoElement: HTMLVideoElement | null): boolean {
  const validation = validateVideoElement(videoElement);
  return validation.isReady;
}

/**
 * Wait for video element to be ready for processing
 */
export function waitForVideoReady(
  videoElement: HTMLVideoElement | null,
  timeoutMs: number = 5000
): Promise<VideoValidationResult> {
  return new Promise((resolve, reject) => {
    if (!videoElement) {
      reject(new EmotionDetectionError('Video element is null', 'processing_error'));
      return;
    }

    const startTime = Date.now();
    
    const checkReady = () => {
      const validation = validateVideoElement(videoElement);
      
      if (validation.isReady) {
        resolve(validation);
        return;
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        reject(new EmotionDetectionError(
          `Video element not ready within ${timeoutMs}ms. Errors: ${validation.errors.join(', ')}`,
          'processing_error'
        ));
        return;
      }

      // Continue checking
      setTimeout(checkReady, 100);
    };

    checkReady();
  });
}

/**
 * Validate video element and throw error if not ready
 */
export function validateVideoElementOrThrow(videoElement: HTMLVideoElement | null): void {
  const validation = validateVideoElement(videoElement);
  
  if (!validation.isValid) {
    throw new EmotionDetectionError(
      `Video element validation failed: ${validation.errors.join(', ')}`,
      'processing_error'
    );
  }
  
  if (!validation.isReady) {
    throw new EmotionDetectionError(
      `Video element not ready for processing: ${validation.errors.join(', ')}`,
      'processing_error'
    );
  }
}

/**
 * Get human-readable description of video element status
 */
export function getVideoStatusDescription(videoElement: HTMLVideoElement | null): string {
  const validation = validateVideoElement(videoElement);
  
  if (!videoElement) {
    return 'No video element provided';
  }
  
  if (validation.isReady) {
    return `Video ready: ${validation.status.videoWidth}x${validation.status.videoHeight}, playing at ${validation.status.currentTime.toFixed(1)}s`;
  }
  
  if (validation.errors.length > 0) {
    return `Video not ready: ${validation.errors[0]}`;
  }
  
  return 'Video status unknown';
}