/**
 * Integration test for model loading verification and error handling
 * This test verifies the actual functionality without complex mocking
 */

import {
  getModelLoadingStatus,
  resetModelLoadingStatus,
  areModelsLoaded,
} from './emotionDetection';

describe('Model Loading Integration', () => {
  beforeEach(() => {
    resetModelLoadingStatus();
  });

  describe('getModelLoadingStatus', () => {
    it('should return initial status with correct structure', () => {
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
    it('should reset all status fields to initial values', () => {
      resetModelLoadingStatus();
      
      const status = getModelLoadingStatus();
      expect(status.retryCount).toBe(0);
      expect(status.lastError).toBeNull();
      expect(status.isLoading).toBe(false);
      expect(areModelsLoaded()).toBe(false);
    });
  });

  describe('areModelsLoaded', () => {
    it('should return false initially', () => {
      expect(areModelsLoaded()).toBe(false);
    });
  });
});