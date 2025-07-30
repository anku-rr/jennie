/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ChatRequest, EmotionData } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

// Mock NextResponse properly for Node environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data: any, init?: { status?: number }) => {
      return {
        json: async () => data,
        status: init?.status || 200,
      };
    }),
  },
}));

// Import POST after mocking
import { POST } from './route';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...originalEnv };
  process.env.PERPLEXITY_API_KEY = 'test-api-key';
  
  // Suppress console.error during tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
  
  // Reset NextResponse mock
  const { NextResponse } = require('next/server');
  NextResponse.json.mockImplementation((data: any, init?: { status?: number }) => {
    return {
      json: async () => data,
      status: init?.status || 200,
    };
  });
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

// Helper function to create mock request
function createMockRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as any;
}

// Mock Perplexity API response
const mockPerplexityResponse = {
  id: 'test-id',
  model: 'llama-3.1-sonar-small-128k-online',
  created: Date.now(),
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
  object: 'chat.completion',
  choices: [
    {
      index: 0,
      finish_reason: 'stop',
      message: {
        role: 'assistant',
        content: 'Thank you for sharing that with me. I can hear that you\'re going through a difficult time right now.',
      },
      delta: {},
    },
  ],
};

describe('/api/chat', () => {
  describe('POST', () => {
    it('should successfully process a basic chat request', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPerplexityResponse),
      } as any);

      const requestBody: ChatRequest = {
        message: 'I\'m feeling anxious today',
        sessionId: 'test-session-123',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.response).toBe(mockPerplexityResponse.choices[0].message.content);
      expect(responseData.sessionId).toBe('test-session-123');
      expect(responseData.timestamp).toBeDefined();
    });

    it('should include emotion context in system prompt when provided', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPerplexityResponse),
      } as any);

      const emotionContext: EmotionData = {
        dominant: 'sad',
        confidence: 0.8,
        emotions: {
          happy: 0.1,
          sad: 0.8,
          angry: 0.05,
          surprised: 0.02,
          neutral: 0.02,
          fearful: 0.01,
          disgusted: 0.0,
        },
        timestamp: new Date().toISOString(),
      };

      const requestBody: ChatRequest = {
        message: 'I don\'t know what to do',
        sessionId: 'test-session-456',
        emotionContext,
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('sad'),
        })
      );
    });

    it('should handle conversation history correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPerplexityResponse),
      } as any);

      const conversationHistory = [
        {
          id: '1',
          content: 'Hello',
          sender: 'user' as const,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          content: 'Hello! How are you feeling today?',
          sender: 'jennie' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      const requestBody: ChatRequest = {
        message: 'I\'m feeling better now',
        sessionId: 'test-session-789',
        conversationHistory,
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.messages).toHaveLength(4); // system + 2 history + current message
      expect(callBody.messages[1].role).toBe('user');
      expect(callBody.messages[1].content).toBe('Hello');
      expect(callBody.messages[2].role).toBe('assistant');
      expect(callBody.messages[2].content).toBe('Hello! How are you feeling today?');
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        message: 'Hello',
        // Missing sessionId
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toContain('Missing required fields');
    });

    it('should return 500 when API key is missing', async () => {
      delete process.env.PERPLEXITY_API_KEY;

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toContain('Service configuration error');
    }, 10000);

    it('should handle Perplexity API errors gracefully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      } as any);

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toContain('having trouble responding');
    }, 10000);

    it('should handle rate limiting (429 errors)', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limit exceeded'),
      } as any);

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      
      expect(response.status).toBe(429);
      const responseData = await response.json();
      expect(responseData.error).toContain('Too many requests');
    });

    it('should retry failed requests with exponential backoff', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      
      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValue('Server Error'),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValue('Server Error'),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPerplexityResponse),
        } as any);

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.response).toBe(mockPerplexityResponse.choices[0].message.content);
    }, 10000);

    it('should not retry client errors (4xx)', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request'),
      } as any);

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 4xx errors
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Invalid request');
    });

    it('should limit conversation history to last 10 messages', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPerplexityResponse),
      } as any);

      // Create 15 messages in history
      const conversationHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        content: `Message ${i + 1}`,
        sender: (i % 2 === 0 ? 'user' : 'jennie') as const,
        timestamp: new Date().toISOString(),
      }));

      const requestBody: ChatRequest = {
        message: 'Current message',
        sessionId: 'test-session',
        conversationHistory,
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      // Should have system prompt + 10 history messages + current message = 12 total
      expect(callBody.messages).toHaveLength(12);
      
      // Should include the last 10 messages from history
      expect(callBody.messages[1].content).toBe('Message 6'); // First message in the limited history
      expect(callBody.messages[10].content).toBe('Message 15'); // Last message in history
      expect(callBody.messages[11].content).toBe('Current message'); // Current message
    });

    it('should handle empty response from Perplexity API', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      const emptyResponse = {
        ...mockPerplexityResponse,
        choices: [
          {
            ...mockPerplexityResponse.choices[0],
            message: {
              role: 'assistant',
              content: '',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(emptyResponse),
      } as any);

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toContain('having trouble responding');
    });

    it('should use correct Perplexity API parameters', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPerplexityResponse),
      } as any);

      const requestBody: ChatRequest = {
        message: 'Hello',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.model).toBe('llama-3.1-sonar-small-128k-online');
      expect(callBody.max_tokens).toBe(500);
      expect(callBody.temperature).toBe(0.7);
      expect(callBody.top_p).toBe(0.9);
      expect(callBody.return_citations).toBe(false);
      expect(callBody.return_images).toBe(false);
      expect(callBody.return_related_questions).toBe(false);
    });
  });

  describe('Therapeutic Prompt Engineering', () => {
    it('should include therapeutic personality in system prompt', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPerplexityResponse),
      } as any);

      const requestBody: ChatRequest = {
        message: 'I need help',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      const systemMessage = callBody.messages[0];
      
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('Jennie');
      expect(systemMessage.content).toContain('compassionate');
      expect(systemMessage.content).toContain('therapist');
      expect(systemMessage.content).toContain('empathetic');
    });
  });
});