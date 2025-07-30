import * as faceapi from 'face-api.js';
import { EmotionData, EmotionType } from '@/types';
import { 
  logModelLoadingStart, 
  logModelLoadingComplete, 
  logDetectionStart, 
  logDetectionSuccess, 
  logDetectionFailure,
  updateModelLoadingStatus,
  logModelLoadingRetry
} from './emotionDebug';
import { validateVideoElement, isVideoElementReady, getVideoStatusDescription } from './videoValidation';

// Model loading configuration
const MODEL_URL = '/models';
let modelsLoaded = false;
let isLoading = false;

// Enhanced model loading status tracking
interface ModelLoadingStatus {
  tinyFaceDetector: boolean;
  faceExpressionNet: boolean;
  isLoading: boolean;
  loadingStartTime: number | null;
  loadingDuration: number | null;
  lastError: string | null;
  retryCount: number;
  maxRetries: number;
}

let modelStatus: ModelLoadingStatus = {
  tinyFaceDetector: false,
  faceExpressionNet: false,
  isLoading: false,
  loadingStartTime: null,
  loadingDuration: null,
  lastError: null,
  retryCount: 0,
  maxRetries: 3,
};

/**
 * Get current model loading status
 */
export function getModelLoadingStatus(): ModelLoadingStatus {
  return { ...modelStatus };
}

/**
 * Reset model loading status
 */
export function resetModelLoadingStatus(): void {
  modelStatus = {
    tinyFaceDetector: false,
    faceExpressionNet: false,
    isLoading: false,
    loadingStartTime: null,
    loadingDuration: null,
    lastError: null,
    retryCount: 0,
    maxRetries: 3,
  };
  modelsLoaded = false;
  isLoading = false;
}

/**
 * Verify that models are properly loaded and functional
 */
export async function verifyModelsLoaded(): Promise<boolean> {
  try {
    console.log('[ModelVerification] Starting verification...');
    console.log('[ModelVerification] Current state:', {
      modelsLoaded,
      faceApiAvailable: typeof faceapi !== 'undefined',
      netsAvailable: typeof faceapi?.nets !== 'undefined'
    });

    // Verify each model is actually available
    const tinyFaceDetectorLoaded = faceapi?.nets?.tinyFaceDetector?.isLoaded || false;
    const faceExpressionNetLoaded = faceapi?.nets?.faceExpressionNet?.isLoaded || false;

    console.log('[ModelVerification] Model states:', {
      tinyFaceDetectorLoaded,
      faceExpressionNetLoaded
    });

    modelStatus.tinyFaceDetector = tinyFaceDetectorLoaded;
    modelStatus.faceExpressionNet = faceExpressionNetLoaded;

    const allModelsLoaded = tinyFaceDetectorLoaded && faceExpressionNetLoaded;

    if (!allModelsLoaded) {
      const missingModels = [];
      if (!tinyFaceDetectorLoaded) missingModels.push('tinyFaceDetector');
      if (!faceExpressionNetLoaded) missingModels.push('faceExpressionNet');
      
      modelStatus.lastError = `Models not properly loaded: ${missingModels.join(', ')}`;
      console.error('[ModelVerification] Models not properly loaded:', missingModels);
      
      // Don't reset modelsLoaded flag here - let the loading process handle it
      return false;
    }

    console.log('[ModelVerification] All models verified successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    modelStatus.lastError = `Model verification failed: ${errorMessage}`;
    console.error('[ModelVerification] Verification failed:', error);
    return false;
  }
}

/**
 * Load individual model with specific error handling
 */
async function loadIndividualModel(
  modelName: 'tinyFaceDetector' | 'faceExpressionNet',
  loadFunction: () => Promise<void>
): Promise<void> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ModelLoading] Loading ${modelName} (attempt ${attempt}/${maxRetries})`);
      await loadFunction();
      
      // Verify the model actually loaded
      const isLoaded = modelName === 'tinyFaceDetector' 
        ? faceapi.nets.tinyFaceDetector.isLoaded
        : faceapi.nets.faceExpressionNet.isLoaded;

      if (!isLoaded) {
        throw new Error(`${modelName} failed to load properly`);
      }

      console.log(`[ModelLoading] ${modelName} loaded successfully`);
      modelStatus[modelName] = true;
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[ModelLoading] ${modelName} loading attempt ${attempt} failed:`, lastError.message);
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Cap at 5 seconds
        console.log(`[ModelLoading] Retrying ${modelName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  throw new EmotionDetectionError(
    `Failed to load ${modelName} after ${maxRetries} attempts: ${lastError?.message}`,
    'model_load_failed'
  );
}

/**
 * Load face-api.js models required for emotion detection with comprehensive error handling and retry logic
 */
export async function loadEmotionModels(): Promise<void> {
  if (modelsLoaded && await verifyModelsLoaded()) {
    return;
  }

  if (isLoading) {
    // Wait for existing loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check if loading succeeded
    if (modelsLoaded && await verifyModelsLoaded()) {
      return;
    }
  }

  try {
    isLoading = true;
    modelStatus.isLoading = true;
    modelStatus.loadingStartTime = Date.now();
    modelStatus.retryCount++;
    modelStatus.lastError = null;
    
    logModelLoadingStart();
    console.log(`[ModelLoading] Starting model loading (attempt ${modelStatus.retryCount}/${modelStatus.maxRetries})`);
    
    // Reset individual model status
    modelStatus.tinyFaceDetector = false;
    modelStatus.faceExpressionNet = false;

    // Load models individually with specific error handling
    const modelLoadingPromises = [
      loadIndividualModel('tinyFaceDetector', () => 
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      ),
      loadIndividualModel('faceExpressionNet', () => 
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ),
    ];

    await Promise.all(modelLoadingPromises);
    
    // Set models as loaded first
    modelsLoaded = true;
    modelStatus.loadingDuration = Date.now() - (modelStatus.loadingStartTime || 0);
    
    console.log(`[ModelLoading] Models loaded in ${modelStatus.loadingDuration}ms, verifying...`);
    
    // Final verification
    const verificationResult = await verifyModelsLoaded();
    if (!verificationResult) {
      console.error('[ModelLoading] Model verification failed after loading');
      modelsLoaded = false; // Reset only if verification truly fails
      throw new EmotionDetectionError(
        'Model verification failed after loading',
        'model_load_failed'
      );
    }
    
    console.log(`[ModelLoading] All models loaded and verified successfully in ${modelStatus.loadingDuration}ms`);
    console.log('[ModelLoading] Final model status:', {
      tinyFaceDetector: modelStatus.tinyFaceDetector,
      faceExpressionNet: modelStatus.faceExpressionNet,
      modelsLoaded: modelsLoaded
    });
    
    updateModelLoadingStatus(modelStatus);
    logModelLoadingComplete(true);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    modelStatus.lastError = errorMessage;
    modelStatus.loadingDuration = Date.now() - (modelStatus.loadingStartTime || 0);
    
    console.error('[ModelLoading] Failed to load emotion detection models:', error);
    updateModelLoadingStatus(modelStatus);
    logModelLoadingComplete(false, errorMessage);
    
    // Determine if we should retry
    if (modelStatus.retryCount < modelStatus.maxRetries) {
      console.log(`[ModelLoading] Will retry loading (${modelStatus.retryCount}/${modelStatus.maxRetries})`);
      
      // Reset loading state for retry
      isLoading = false;
      modelStatus.isLoading = false;
      
      // Retry with exponential backoff
      const retryDelay = Math.min(2000 * Math.pow(2, modelStatus.retryCount - 1), 10000);
      console.log(`[ModelLoading] Retrying in ${retryDelay}ms...`);
      
      // Update debug status
      updateModelLoadingStatus(modelStatus);
      logModelLoadingRetry(modelStatus.retryCount, modelStatus.maxRetries, retryDelay);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return loadEmotionModels(); // Recursive retry
    }
    
    // All retries exhausted
    throw new EmotionDetectionError(
      `Failed to initialize emotion detection models after ${modelStatus.maxRetries} attempts: ${errorMessage}`,
      'model_load_failed'
    );
  } finally {
    isLoading = false;
    modelStatus.isLoading = false;
  }
}

/**
 * Check if emotion detection models are loaded
 */
export function areModelsLoaded(): boolean {
  // Simple check - just verify the basic loading flag and face-api availability
  const basicCheck = modelsLoaded && typeof faceapi !== 'undefined';
  
  // Additional check for model availability
  const modelsAvailable = faceapi?.nets?.tinyFaceDetector?.isLoaded && 
                         faceapi?.nets?.faceExpressionNet?.isLoaded;
  
  console.log('[areModelsLoaded] Check result:', {
    modelsLoaded,
    basicCheck,
    modelsAvailable,
    final: basicCheck && modelsAvailable
  });
  
  return basicCheck && modelsAvailable;
}

/**
 * Check if emotion detection models are loaded and verified
 */
export async function areModelsLoadedAndVerified(): Promise<boolean> {
  if (!modelsLoaded) {
    return false;
  }
  return await verifyModelsLoaded();
}

/**
 * Force reset model loading state (for testing and debugging)
 */
export function resetModelState(): void {
  modelsLoaded = false;
  isLoading = false;
  resetModelLoadingStatus();
}

/**
 * Simple model loading for debugging - bypasses complex retry logic
 */
export async function loadEmotionModelsSimple(): Promise<void> {
  console.log('[SimpleModelLoading] Starting simple model loading...');
  
  try {
    // Load models directly
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    console.log('[SimpleModelLoading] TinyFaceDetector loaded');
    
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    console.log('[SimpleModelLoading] FaceExpressionNet loaded');
    
    // Simple verification
    const tinyLoaded = faceapi.nets.tinyFaceDetector.isLoaded;
    const expressionLoaded = faceapi.nets.faceExpressionNet.isLoaded;
    
    console.log('[SimpleModelLoading] Verification:', { tinyLoaded, expressionLoaded });
    
    if (tinyLoaded && expressionLoaded) {
      modelsLoaded = true;
      modelStatus.tinyFaceDetector = true;
      modelStatus.faceExpressionNet = true;
      console.log('[SimpleModelLoading] Models loaded successfully');
    } else {
      throw new Error('Models failed to load properly');
    }
  } catch (error) {
    console.error('[SimpleModelLoading] Failed:', error);
    throw error;
  }
}

/**
 * Detect emotions from a video element or canvas
 * PRIVACY: This function processes video data entirely locally in the browser.
 * No video frames or facial data are transmitted to any external servers.
 */
export async function detectEmotions(
  input: HTMLVideoElement | HTMLCanvasElement
): Promise<EmotionData | null> {
  // Double-check models are loaded and verified
  if (!modelsLoaded || !await verifyModelsLoaded()) {
    const error = 'Emotion detection models not loaded or verified';
    logDetectionFailure(error);
    console.error('[EmotionDetection] Models not ready:', {
      modelsLoaded,
      tinyFaceDetectorLoaded: faceapi.nets.tinyFaceDetector.isLoaded,
      faceExpressionNetLoaded: faceapi.nets.faceExpressionNet.isLoaded
    });
    throw new Error(error);
  }

  // PRIVACY SAFEGUARD: Ensure we're only processing local video elements
  if (!(input instanceof HTMLVideoElement) && !(input instanceof HTMLCanvasElement)) {
    const error = 'Invalid input type for emotion detection';
    logDetectionFailure(error);
    throw new EmotionDetectionError(error, 'processing_error');
  }

  // Validate video element if it's a video element
  if (input instanceof HTMLVideoElement) {
    const validation = validateVideoElement(input);
    if (!validation.isValid) {
      const error = `Video element validation failed: ${validation.errors.join(', ')}`;
      logDetectionFailure(error);
      throw new EmotionDetectionError(error, 'processing_error');
    }
    
    if (!validation.isReady) {
      const error = `Video element not ready: ${validation.errors.join(', ')}`;
      logDetectionFailure(error);
      return null; // Return null instead of throwing for "not ready" state
    }
  }

  logDetectionStart();
  const startTime = performance.now();

  try {
    // Detect face with expressions - ALL PROCESSING HAPPENS LOCALLY
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (!detection) {
      logDetectionFailure('No face detected');
      return null; // No face detected
    }

    const expressions = detection.expressions;
    
    // Map face-api.js expressions to our emotion types
    const emotions = {
      happy: expressions.happy,
      sad: expressions.sad,
      angry: expressions.angry,
      surprised: expressions.surprised,
      neutral: expressions.neutral,
      fearful: expressions.fearful,
      disgusted: expressions.disgusted,
    };

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotions).reduce((a, b) =>
      emotions[a[0] as EmotionType] > emotions[b[0] as EmotionType] ? a : b
    )[0] as EmotionType;

    const confidence = emotions[dominantEmotion];

    // PRIVACY: Only return emotion metadata, never raw video data
    const emotionData: EmotionData = {
      dominant: dominantEmotion,
      confidence,
      emotions,
      timestamp: new Date().toISOString(),
    };

    const processingTime = performance.now() - startTime;
    logDetectionSuccess(emotionData, processingTime);

    return emotionData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error detecting emotions:', error);
    logDetectionFailure(errorMessage);
    throw new EmotionDetectionError('Failed to process emotion detection', 'processing_error');
  }
}

/**
 * Performance optimization: Adaptive frame rate based on system performance
 */
export class AdaptiveFrameRate {
  private targetFPS = 10; // Start with 10 FPS
  private minFPS = 2;
  private maxFPS = 15;
  private performanceHistory: number[] = [];
  private maxHistorySize = 10;
  private cpuUsageHistory: number[] = [];
  private lastFrameTime = 0;
  private frameDropCount = 0;
  private totalFrames = 0;

  /**
   * Calculate optimal frame rate based on processing time and system performance
   */
  public getOptimalInterval(processingTime: number): number {
    const currentTime = performance.now();
    
    // Track frame timing
    if (this.lastFrameTime > 0) {
      const actualInterval = currentTime - this.lastFrameTime;
      const expectedInterval = 1000 / this.targetFPS;
      
      // Detect frame drops
      if (actualInterval > expectedInterval * 1.5) {
        this.frameDropCount++;
      }
    }
    
    this.lastFrameTime = currentTime;
    this.totalFrames++;

    // Add processing time to history
    this.performanceHistory.push(processingTime);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }

    // Calculate performance metrics
    const avgProcessingTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    const frameDropRate = this.frameDropCount / Math.max(this.totalFrames, 1);
    
    // Estimate CPU usage based on processing time vs available time
    const availableTime = 1000 / this.targetFPS;
    const cpuUsage = Math.min(100, (avgProcessingTime / availableTime) * 100);
    
    this.cpuUsageHistory.push(cpuUsage);
    if (this.cpuUsageHistory.length > this.maxHistorySize) {
      this.cpuUsageHistory.shift();
    }

    // Adaptive FPS adjustment with multiple factors
    const avgCpuUsage = this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length;
    
    // Decrease FPS if system is struggling
    if (avgProcessingTime > 200 || avgCpuUsage > 80 || frameDropRate > 0.2) {
      this.targetFPS = Math.max(this.minFPS, this.targetFPS - 1);
    } 
    // Increase FPS if system can handle more
    else if (avgProcessingTime < 50 && avgCpuUsage < 40 && frameDropRate < 0.05) {
      this.targetFPS = Math.min(this.maxFPS, this.targetFPS + 1);
    }

    // Reset counters periodically
    if (this.totalFrames > 100) {
      this.frameDropCount = Math.floor(this.frameDropCount * 0.8);
      this.totalFrames = Math.floor(this.totalFrames * 0.8);
    }

    return 1000 / this.targetFPS;
  }

  public getCurrentFPS(): number {
    return this.targetFPS;
  }

  public getPerformanceMetrics(): {
    fps: number;
    avgProcessingTime: number;
    avgCpuUsage: number;
    frameDropRate: number;
  } {
    const avgProcessingTime = this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length 
      : 0;
    
    const avgCpuUsage = this.cpuUsageHistory.length > 0
      ? this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length
      : 0;
    
    const frameDropRate = this.frameDropCount / Math.max(this.totalFrames, 1);

    return {
      fps: this.targetFPS,
      avgProcessingTime,
      avgCpuUsage,
      frameDropRate
    };
  }

  public reset(): void {
    this.targetFPS = 10;
    this.performanceHistory = [];
    this.cpuUsageHistory = [];
    this.frameDropCount = 0;
    this.totalFrames = 0;
    this.lastFrameTime = 0;
  }

  /**
   * Complete cleanup of the adaptive frame rate manager
   * This ensures no memory leaks when the component is destroyed
   */
  public cleanup(): void {
    this.reset();
    // Clear any additional resources if needed in the future
  }
}

/**
 * Emotion detection error types
 */
export class EmotionDetectionError extends Error {
  constructor(
    message: string,
    public readonly type: 'model_load_failed' | 'detection_failed' | 'no_face_detected' | 'processing_error'
  ) {
    super(message);
    this.name = 'EmotionDetectionError';
  }
}