import { PerplexityChatAPI, ChatAPIError } from './api';
import { Message, EmotionData } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('PerplexityChatAPI', () => {
  let api: PerplexityChatAPI;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    api = new PerplexityChatAPI();
    jest.resetAllMocks();
  });

  const mockMessage: Message = {
    id: '1',
    content: 'Hello',
    sender: 'user',
    timestamp: new Date().toISOString(),
  };

  const mockEmotionContext: EmotionData = {
    dominant: 'happy',
    confidence: 0.8,
    emotions: {
      happy: 0.8,
      sad: 0.1,
      angry: 0.05,
      surprised: 0.02,
      neutral: 0.02,
      fearful: 0.01,
      disgusted: 0.0,
    },
    timestamp: new Date().toISOString(),
  };

  it('should send message successfully', async () => {
    const mockResponse = {
      response: 'Hello! How can I help you today?',
      sessionId: 'test-session',
      timestamp: new Date().toISOString(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await api.sendMessage(
      'Hello',
      'test-session',
      [mockMessage],
      mockEmotionContext
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [mockMessage],
        emotionContext: mockEmotionContext,
      }),
      signal: expect.any(AbortSignal)
    });
  });

  it('should handle API errors correctly', async () => {
    const errorResponse = { error: 'Rate limit exceeded' };
    
    // Mock all retry attempts to fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue(errorResponse),
    } as any);

    try {
      await api.sendMessage('Hello', 'test-session', []);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ChatAPIError);
      expect((error as ChatAPIError).status).toBe(429);
      expect((error as ChatAPIError).message).toBe('Rate limit exceeded');
      expect((error as ChatAPIError).retryable).toBe(true);
    }
  }, 10000);

  it('should handle network errors', async () => {
    // Mock all retry attempts to fail
    mockFetch.mockRejectedValue(new Error('Network error'));

    try {
      await api.sendMessage('Hello', 'test-session', []);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ChatAPIError);
      expect((error as ChatAPIError).status).toBe(0);
      expect((error as ChatAPIError).code).toBe('NETWORK_ERROR');
      expect((error as ChatAPIError).retryable).toBe(false); // After max retries
    }
  }, 10000);

  it('should handle malformed JSON responses', async () => {
    // Mock all retry attempts to fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as any);

    try {
      await api.sendMessage('Hello', 'test-session', []);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ChatAPIError);
      expect((error as ChatAPIError).status).toBe(500);
      expect((error as ChatAPIError).message).toBe('Unknown error');
      expect((error as ChatAPIError).retryable).toBe(true);
    }
  }, 10000);

  it('should send message without emotion context', async () => {
    const mockResponse = {
      response: 'Hello! How can I help you today?',
      sessionId: 'test-session',
      timestamp: new Date().toISOString(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await api.sendMessage(
      'Hello',
      'test-session',
      [mockMessage]
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [mockMessage],
      }),
      signal: expect.any(AbortSignal)
    });
  });

  it('should retry on retryable errors and eventually succeed', async () => {
    const mockResponse = {
      response: 'Hello! How can I help you today?',
      sessionId: 'test-session',
      timestamp: new Date().toISOString(),
    };

    // First two calls fail, third succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Server error' }),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Server error' }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

    const result = await api.sendMessage('Hello', 'test-session', [mockMessage]);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it('should not retry non-retryable errors', async () => {
    const errorResponse = { error: 'Bad request' };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue(errorResponse),
    } as any);

    try {
      await api.sendMessage('Hello', 'test-session', []);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ChatAPIError);
      expect((error as ChatAPIError).status).toBe(400);
      expect((error as ChatAPIError).retryable).toBe(false);
    }

    // Should only be called once (no retries)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});