/**
 * Comprehensive tests for model loading verification and error handling
 */

import * as faceapi from 'face-api.js';
import {
  loadEmotionModels,
  areModelsLoaded,
  areModelsLoadedAndVerified,
  getModelLoadingStatus,
  resetModelLoadingStatus,
  verifyModelsLoaded,
  EmotionDetectionError,
} from './emotionDetection';

// Mock face-api.js
const mockTinyFaceDetector = {
  loadFromUri: jest.fn(),
  get isLoaded() { return this._isLoaded; },
  _isLoaded: false,
};

const mockFaceExpressionNet = {
  loadFromUri: jest.fn(),
  get isLoaded() { return this._isLoaded; },
  _isLoaded: false,
};

jest.mock('face-api.js', () => ({
  nets: {
    tinyFaceDetector: mockTinyFaceDetector,
    faceExpressionNet: mockFaceExpressionNet,
  },
}));

// Mock emotion debug utilities
jest.mock('./emotionDebug', () => ({
  logModelLoadingStart: jest.fn(),
  logModelLoadingComplete: jest.fn(),
  updateModelLoadingStatus: jest.fn(),
  logModelLoadingRetry: jest.fn(),
}));

describe('Model Loading Verification and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetModelLoadingStatus();
    
    // Reset face-api mock state
    mockTinyFaceDetector._isLoaded = false;
    mockFaceExpressionNet._isLoaded = false;
    mockTinyFaceDetector.loadFromUri.mockReset();
    mockFaceExpressionNet.loadFromUri.mockReset();
  });

  describe('getModelLoadingStatus', () => {
    it('should return initial status', () => {
      const status = getModelLoadingStatus();
      
      expect(status).toEqual({
        tinyFaceDetector: false,
        faceExpressionNet: false,
        isLoading: false,
        loadingStartTime: null,
        loadingDuration: null,
        lastError: null,
        retryCount: 0,
        maxRetries: 3,
      });
    });
  });

  describe('resetModelLoadingStatus', () => {
    it('should reset all status fields', () => {
      // First load some models to change the status
      const status = getModelLoadingStatus();
      status.retryCount = 2;
      status.lastError = 'Some error';
      
      resetModelLoadingStatus();
      
      const resetStatus = getModelLoadingStatus();
      expect(resetStatus.retryCount).toBe(0);
      expect(resetStatus.lastError).toBeNull();
      expect(areModelsLoaded()).toBe(false);
    });
  });

  describe('verifyModelsLoaded', () => {
    it('should return false when models are not marked as loaded', async () => {
      const result = await verifyModelsLoaded();
      expect(result).toBe(false);
    });

    it('should return false when models are marked loaded but face-api reports not loaded', async () => {
      // Simulate models being marked as loaded but face-api says they're not
      mockTinyFaceDetector._isLoaded = false;
      mockFaceExpressionNet._isLoaded = false;
      
      const result = await verifyModelsLoaded();
      expect(result).toBe(false);
    });

    it('should return true when all models are properly loaded', async () => {
      // Mock successful loading
      mockTinyFaceDetector.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      mockTinyFaceDetector._isLoaded = true;
      mockFaceExpressionNet._isLoaded = true;
      
      await loadEmotionModels();
      const result = await verifyModelsLoaded();
      expect(result).toBe(true);
    });

    it('should handle verification errors gracefully', async () => {
      // Mock face-api to throw during verification
      Object.defineProperty(mockTinyFaceDetector, 'isLoaded', {
        get: () => {
          throw new Error('Verification error');
        },
        configurable: true,
      });
      
      const result = await verifyModelsLoaded();
      expect(result).toBe(false);
      
      const status = getModelLoadingStatus();
      expect(status.lastError).toContain('Model verification failed');
      
      // Restore the original getter
      Object.defineProperty(mockTinyFaceDetector, 'isLoaded', {
        get: function() { return this._isLoaded; },
        configurable: true,
      });
    });
  });

  describe('areModelsLoadedAndVerified', () => {
    it('should return false when models are not loaded', async () => {
      const result = await areModelsLoadedAndVerified();
      expect(result).toBe(false);
    });

    it('should verify models when they are marked as loaded', async () => {
      // Mock successful loading
      mockTinyFaceDetector.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      mockTinyFaceDetector._isLoaded = true;
      mockFaceExpressionNet._isLoaded = true;
      
      await loadEmotionModels();
      const result = await areModelsLoadedAndVerified();
      expect(result).toBe(true);
    });
  });

  describe('loadEmotionModels', () => {
    it('should load models successfully on first attempt', async () => {
      // Mock successful loading
      mockTinyFaceDetector.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      mockTinyFaceDetector._isLoaded = true;
      mockFaceExpressionNet._isLoaded = true;
      
      await loadEmotionModels();
      
      expect(areModelsLoaded()).toBe(true);
      expect(mockTinyFaceDetector.loadFromUri).toHaveBeenCalledWith('/models');
      expect(mockFaceExpressionNet.loadFromUri).toHaveBeenCalledWith('/models');
      
      const status = getModelLoadingStatus();
      expect(status.tinyFaceDetector).toBe(true);
      expect(status.faceExpressionNet).toBe(true);
      expect(status.retryCount).toBe(1);
      expect(status.lastError).toBeNull();
    });

    it('should retry loading on individual model failure', async () => {
      let tinyFaceDetectorAttempts = 0;
      
      // Mock tinyFaceDetector to fail twice, then succeed
      mockTinyFaceDetector.loadFromUri.mockImplementation(() => {
        tinyFaceDetectorAttempts++;
        if (tinyFaceDetectorAttempts <= 2) {
          throw new Error('Network error');
        }
        mockTinyFaceDetector._isLoaded = true;
        return Promise.resolve();
      });
      
      // Mock faceExpressionNet to succeed immediately
      mockFaceExpressionNet.loadFromUri.mockImplementation(() => {
        mockFaceExpressionNet._isLoaded = true;
        return Promise.resolve();
      });
      
      await loadEmotionModels();
      
      expect(areModelsLoaded()).toBe(true);
      expect(tinyFaceDetectorAttempts).toBe(3); // Failed twice, succeeded on third
      
      const status = getModelLoadingStatus();
      expect(status.tinyFaceDetector).toBe(true);
      expect(status.faceExpressionNet).toBe(true);
    });

    it('should fail after maximum retries', async () => {
      // Mock both models to always fail
      mockTinyFaceDetector.loadFromUri.mockRejectedValue(new Error('Persistent network error'));
      mockFaceExpressionNet.loadFromUri.mockRejectedValue(new Error('Persistent network error'));
      
      await expect(loadEmotionModels()).rejects.toThrow(EmotionDetectionError);
      await expect(loadEmotionModels()).rejects.toThrow('Failed to initialize emotion detection models after 3 attempts');
      
      expect(areModelsLoaded()).toBe(false);
      
      const status = getModelLoadingStatus();
      expect(status.retryCount).toBe(3);
      expect(status.lastError).toContain('Persistent network error');
    });

    it('should handle verification failure after loading', async () => {
      // Mock loading to succeed but verification to fail
      mockTinyFaceDetector.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      
      // Models report as loaded during loading but not during verification
      let verificationCall = false;
      Object.defineProperty(mockTinyFaceDetector, 'isLoaded', {
        get: () => {
          if (verificationCall) return false; // Fail verification
          verificationCall = true;
          return true; // Succeed during loading
        },
        configurable: true,
      });
      mockFaceExpressionNet._isLoaded = true;
      
      await expect(loadEmotionModels()).rejects.toThrow(EmotionDetectionError);
      await expect(loadEmotionModels()).rejects.toThrow('Model verification failed after loading');
      
      // Restore the original getter
      Object.defineProperty(mockTinyFaceDetector, 'isLoaded', {
        get: function() { return this._isLoaded; },
        configurable: true,
      });
    });

    it('should not reload if models are already loaded and verified', async () => {
      // Mock successful loading first time
      mockTinyFaceDetector.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      mockTinyFaceDetector._isLoaded = true;
      mockFaceExpressionNet._isLoaded = true;
      
      await loadEmotionModels();
      
      // Clear mock call history
      mockTinyFaceDetector.loadFromUri.mockClear();
      mockFaceExpressionNet.loadFromUri.mockClear();
      
      // Call again - should not reload
      await loadEmotionModels();
      
      expect(mockTinyFaceDetector.loadFromUri).not.toHaveBeenCalled();
      expect(mockFaceExpressionNet.loadFromUri).not.toHaveBeenCalled();
    });

    it('should handle concurrent loading attempts', async () => {
      let loadingStarted = false;
      let loadingDelay = 100;
      
      // Mock loading with delay to simulate concurrent calls
      mockTinyFaceDetector.loadFromUri.mockImplementation(async () => {
        if (loadingStarted) {
          // Second call should wait
          await new Promise(resolve => setTimeout(resolve, loadingDelay * 2));
        } else {
          loadingStarted = true;
          await new Promise(resolve => setTimeout(resolve, loadingDelay));
        }
        mockTinyFaceDetector._isLoaded = true;
      });
      
      mockFaceExpressionNet.loadFromUri.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, loadingDelay));
        mockFaceExpressionNet._isLoaded = true;
      });
      
      // Start two concurrent loading attempts
      const promise1 = loadEmotionModels();
      const promise2 = loadEmotionModels();
      
      await Promise.all([promise1, promise2]);
      
      expect(areModelsLoaded()).toBe(true);
      // Should only load once despite concurrent calls
      expect(mockTinyFaceDetector.loadFromUri).toHaveBeenCalledTimes(1);
      expect(mockFaceExpressionNet.loadFromUri).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error message specificity', () => {
    it('should provide specific error messages for different failure scenarios', async () => {
      // Test network error
      mockTinyFaceDetector.loadFromUri.mockRejectedValue(new Error('Failed to fetch'));
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet._isLoaded = true;
      
      await expect(loadEmotionModels()).rejects.toThrow('Failed to load tinyFaceDetector after 3 attempts: Failed to fetch');
      
      resetModelLoadingStatus();
      
      // Test model not properly loaded error
      mockTinyFaceDetector.loadFromUri.mockResolvedValue(undefined);
      mockFaceExpressionNet.loadFromUri.mockResolvedValue(undefined);
      mockTinyFaceDetector._isLoaded = false; // Simulate loading but not actually loaded
      mockFaceExpressionNet._isLoaded = true;
      
      await expect(loadEmotionModels()).rejects.toThrow('Failed to load tinyFaceDetector after 3 attempts: tinyFaceDetector failed to load properly');
    });
  });
});