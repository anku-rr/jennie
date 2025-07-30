import { ErrorHandler, AppError, RetryManager } from '@/lib/errorHandling';
import { WebcamError } from '@/types';
import { ChatAPIError } from '@/lib/api';

describe('ErrorHandler', () => {
  describe('createAppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = ErrorHandler.createAppError(
        'network',
        'Connection failed',
        'NET_001',
        true,
        'Technical details here'
      );

      expect(error).toEqual({
        type: 'network',
        message: 'Connection failed',
        code: 'NET_001',
        retryable: true,
        userMessage: 'Connection issue detected. Please check your internet connection and try again.',
        technicalDetails: 'Technical details here'
      });
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return appropriate message for network errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('network', 'Connection timeout');
      expect(message).toBe('Connection issue detected. Please check your internet connection and try again.');
    });

    it('should return appropriate message for API rate limit errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('api', 'Rate limited', 'RATE_LIMIT');
      expect(message).toBe('I need a moment to process. Please wait a bit before sending another message.');
    });

    it('should return appropriate message for API timeout errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('api', 'Request timeout', 'TIMEOUT_ERROR');
      expect(message).toBe('The request took too long. Please try again.');
    });

    it('should return generic API message for other API errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('api', 'Server error');
      expect(message).toBe('I\'m having trouble responding right now. Please try again in a moment.');
    });

    it('should return original message for webcam errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('webcam', 'Camera access denied');
      expect(message).toBe('Camera access denied');
    });

    it('should return appropriate message for emotion errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('emotion', 'Model loading failed');
      expect(message).toBe('Emotion detection is temporarily unavailable, but you can continue chatting normally.');
    });

    it('should return appropriate message for session errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('session', 'Session expired');
      expect(message).toBe('Your session has expired. Please refresh the page to continue.');
    });

    it('should return appropriate message for validation errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('validation', 'Invalid input');
      expect(message).toBe('Please check your input and try again.');
    });

    it('should return generic message for unknown errors', () => {
      const message = ErrorHandler.getUserFriendlyMessage('unknown', 'Something went wrong');
      expect(message).toBe('Something unexpected happened. Please try again.');
    });
  });

  describe('fromWebcamError', () => {
    it('should convert WebcamError to AppError', () => {
      const webcamError: WebcamError = {
        type: 'permission_denied',
        message: 'Camera access was denied'
      };

      const appError = ErrorHandler.fromWebcamError(webcamError);

      expect(appError.type).toBe('webcam');
      expect(appError.message).toBe('Camera access was denied');
      expect(appError.code).toBe('permission_denied');
      expect(appError.retryable).toBe(false); // Permission denied is not retryable
      expect(appError.userMessage).toBe('Camera access was denied');
      expect(appError.technicalDetails).toBe('Webcam error type: permission_denied');
    });

    it('should mark non-permission errors as retryable', () => {
      const webcamError: WebcamError = {
        type: 'not_found',
        message: 'No camera found'
      };

      const appError = ErrorHandler.fromWebcamError(webcamError);
      expect(appError.retryable).toBe(true);
    });
  });

  describe('fromChatAPIError', () => {
    it('should convert ChatAPIError to AppError', () => {
      const chatError = new ChatAPIError('API Error', 500, 'SERVER_ERROR', true);
      chatError.name = 'ChatAPIError';

      const appError = ErrorHandler.fromChatAPIError(chatError);

      expect(appError.type).toBe('api');
      expect(appError.message).toBe('API Error');
      expect(appError.code).toBe('SERVER_ERROR');
      expect(appError.retryable).toBe(true);
      expect(appError.technicalDetails).toBe('Status: 500, Code: SERVER_ERROR');
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error');

      const appError = ErrorHandler.fromChatAPIError(unknownError);

      expect(appError.type).toBe('unknown');
      expect(appError.message).toBe('Unknown error');
      expect(appError.retryable).toBe(false);
    });
  });

  describe('fromEmotionError', () => {
    it('should convert emotion error to AppError', () => {
      const emotionError = { message: 'Model failed to load', code: 'MODEL_ERROR' };

      const appError = ErrorHandler.fromEmotionError(emotionError);

      expect(appError.type).toBe('emotion');
      expect(appError.message).toBe('Emotion detection failed');
      expect(appError.code).toBe('MODEL_ERROR');
      expect(appError.retryable).toBe(true);
      expect(appError.technicalDetails).toBe('Model failed to load');
    });
  });

  describe('logError', () => {
    const originalConsoleError = console.error;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should log detailed error in development', () => {
      process.env.NODE_ENV = 'development';
      
      const error: AppError = {
        type: 'network',
        message: 'Connection failed',
        code: 'NET_001',
        retryable: true,
        userMessage: 'Connection issue',
        technicalDetails: 'TCP timeout'
      };

      ErrorHandler.logError(error, 'TestContext');

      expect(console.error).toHaveBeenCalledWith('App Error:', expect.objectContaining({
        type: 'network',
        message: 'Connection failed',
        code: 'NET_001',
        context: 'TestContext',
        technicalDetails: 'TCP timeout'
      }));
    });

    it('should log user-friendly message in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error: AppError = {
        type: 'network',
        message: 'Connection failed',
        code: 'NET_001',
        retryable: true,
        userMessage: 'Connection issue',
        technicalDetails: 'TCP timeout'
      };

      ErrorHandler.logError(error);

      expect(console.error).toHaveBeenCalledWith('Error:', 'Connection issue');
    });
  });
});

describe('RetryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await RetryManager.withRetry(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    const result = await RetryManager.withRetry(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    await expect(RetryManager.withRetry(operation, { maxAttempts: 2 }))
      .rejects.toThrow('Persistent failure');

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should use custom retry configuration', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    const startTime = Date.now();
    const result = await RetryManager.withRetry(operation, {
      maxAttempts: 2,
      baseDelay: 100,
      backoffFactor: 1
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(duration).toBeGreaterThanOrEqual(100); // Should have waited at least 100ms
  });

  it('should respect max delay', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    const startTime = Date.now();
    await RetryManager.withRetry(operation, {
      maxAttempts: 2,
      baseDelay: 1000,
      maxDelay: 50,
      backoffFactor: 2
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should have waited maxDelay (50ms) instead of baseDelay * backoffFactor (2000ms)
    expect(duration).toBeLessThan(200);
    expect(duration).toBeGreaterThanOrEqual(50);
  });
});