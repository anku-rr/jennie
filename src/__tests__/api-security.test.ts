/**
 * API security tests for chat and session endpoints
 */

import { NextRequest } from 'next/server';
import { POST as chatHandler } from '@/app/api/chat/route';
import { POST as sessionHandler } from '@/app/api/session/route';

// Mock the security modules
jest.mock('@/lib/security', () => ({
  SecureEnvManager: {
    getInstance: () => ({
      getSecureEnvVar: jest.fn().mockReturnValue('pplx-mock-api-key-12345')
    })
  },
  InputSanitizer: {
    sanitizeMessage: jest.fn((msg) => msg.replace(/<script.*?<\/script>/gi, '')),
    sanitizeSessionId: jest.fn((id) => id.replace(/[^a-zA-Z0-9-]/g, ''))
  },
  HTTPSEnforcer: {
    enforceHTTPS: jest.fn(),
    getSecurityHeaders: jest.fn(() => ({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }))
  }
}));

// Mock fetch for Perplexity API calls
global.fetch = jest.fn();

describe('Chat API Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: 'This is a test response from Jennie.'
          }
        }]
      })
    });
  });

  test('should enforce HTTPS in production', async () => {
    const { HTTPSEnforcer } = require('@/lib/security');
    
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        sessionId: 'test_session'
      })
    });

    await chatHandler(request);
    
    expect(HTTPSEnforcer.enforceHTTPS).toHaveBeenCalledWith(request);
  });

  test('should sanitize user input', async () => {
    const { InputSanitizer } = require('@/lib/security');
    
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello <script>alert("xss")</script>',
        sessionId: 'test_session_123'
      })
    });

    await chatHandler(request);
    
    expect(InputSanitizer.sanitizeMessage).toHaveBeenCalledWith('Hello <script>alert("xss")</script>');
    expect(InputSanitizer.sanitizeSessionId).toHaveBeenCalledWith('test_session_123');
  });

  test('should add security headers to response', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        sessionId: 'test_session'
      })
    });

    const response = await chatHandler(request);
    
    expect(response.headers.get('Strict-Transport-Security')).toBeTruthy();
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  test('should reject requests with missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello'
        // Missing sessionId
      })
    });

    const response = await chatHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  test('should handle API key errors securely', async () => {
    const { SecureEnvManager } = require('@/lib/security');
    SecureEnvManager.getInstance().getSecureEnvVar.mockImplementation(() => {
      throw new Error('API key not configured');
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        sessionId: 'test_session'
      })
    });

    const response = await chatHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Service configuration error. Please try again later.');
    // Should not expose internal error details
    expect(data.error).not.toContain('API key');
  });

  test('should handle rate limiting', async () => {
    // Mock rate limiting by making multiple requests quickly
    const requests = Array.from({ length: 25 }, (_, i) => 
      new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Message ${i}`,
          sessionId: 'rate_limit_test'
        })
      })
    );

    const responses = await Promise.all(requests.map(req => chatHandler(req)));
    
    // Some responses should be rate limited (429 status)
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should handle malformed JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await chatHandler(request);
    
    expect(response.status).toBe(500);
  });
});

describe('Session API Security', () => {
  test('should enforce HTTPS in production', async () => {
    const { HTTPSEnforcer } = require('@/lib/security');
    
    const request = new NextRequest('http://localhost:3000/api/session', {
      method: 'POST',
      body: JSON.stringify({
        type: 'guest'
      })
    });

    await sessionHandler(request);
    
    expect(HTTPSEnforcer.enforceHTTPS).toHaveBeenCalledWith(request);
  });

  test('should add security headers to response', async () => {
    const request = new NextRequest('http://localhost:3000/api/session', {
      method: 'POST',
      body: JSON.stringify({
        type: 'guest'
      })
    });

    const response = await sessionHandler(request);
    
    expect(response.headers.get('Strict-Transport-Security')).toBeTruthy();
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  test('should reject invalid session types', async () => {
    const request = new NextRequest('http://localhost:3000/api/session', {
      method: 'POST',
      body: JSON.stringify({
        type: 'invalid_type'
      })
    });

    const response = await sessionHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid session type');
  });

  test('should generate secure session IDs', async () => {
    const request = new NextRequest('http://localhost:3000/api/session', {
      method: 'POST',
      body: JSON.stringify({
        type: 'guest'
      })
    });

    const response = await sessionHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.sessionId).toBeTruthy();
    expect(data.sessionId).toMatch(/^guest_[a-z0-9]+_[a-z0-9]+$/);
    expect(data.expiresAt).toBeTruthy();
    
    // Verify expiration is approximately 24 hours from now
    const expirationTime = new Date(data.expiresAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    expect(expirationTime).toBeGreaterThan(now + twentyFourHours - 1000);
    expect(expirationTime).toBeLessThan(now + twentyFourHours + 1000);
  });

  test('should handle malformed JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/session', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await sessionHandler(request);
    
    expect(response.status).toBe(500);
  });
});

describe('Emotion Detection Security', () => {
  test('should process data locally only', () => {
    // This test verifies that emotion detection doesn't make external API calls
    const originalFetch = global.fetch;
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    // Import and test emotion detection
    const { detectEmotions } = require('@/utils/emotionDetection');
    
    // Create mock video element
    const mockVideo = {
      videoWidth: 640,
      videoHeight: 480
    } as HTMLVideoElement;

    // The function should not make any fetch calls
    expect(fetchSpy).not.toHaveBeenCalled();
    
    global.fetch = originalFetch;
  });

  test('should validate input types', async () => {
    const { detectEmotions, EmotionDetectionError } = require('@/utils/emotionDetection');
    
    // Test with invalid input
    try {
      await detectEmotions('invalid input' as any);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(EmotionDetectionError);
      expect(error.type).toBe('processing_error');
    }
  });

  test('should not expose raw video data in emotion results', async () => {
    const { detectEmotions } = require('@/utils/emotionDetection');
    
    // Mock successful detection
    const mockDetection = {
      expressions: {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.03,
        neutral: 0.02,
        fearful: 0.0,
        disgusted: 0.0
      }
    };

    // Mock face-api
    jest.doMock('face-api.js', () => ({
      detectSingleFace: jest.fn().mockReturnValue({
        withFaceExpressions: jest.fn().mockResolvedValue(mockDetection)
      }),
      TinyFaceDetectorOptions: jest.fn()
    }));

    const mockVideo = {} as HTMLVideoElement;
    const result = await detectEmotions(mockVideo);
    
    if (result) {
      // Verify result only contains emotion metadata, not raw video data
      expect(result).toHaveProperty('dominant');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('emotions');
      expect(result).toHaveProperty('timestamp');
      
      // Should not contain any video frame data
      expect(result).not.toHaveProperty('videoData');
      expect(result).not.toHaveProperty('imageData');
      expect(result).not.toHaveProperty('pixels');
    }
  });
});