/**
 * Core security functionality tests
 */

import { SecureEnvManager, InputSanitizer, HTTPSEnforcer } from '@/lib/security';
import { SessionManager } from '@/lib/sessionCleanup';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('SecureEnvManager', () => {
  let envManager: SecureEnvManager;

  beforeEach(() => {
    envManager = SecureEnvManager.getInstance();
    envManager.clearCache();
  });

  test('should retrieve valid environment variable', () => {
    process.env.TEST_VAR = 'test_value';
    const result = envManager.getSecureEnvVar('TEST_VAR');
    expect(result).toBe('test_value');
  });

  test('should throw error for missing required environment variable', () => {
    expect(() => {
      envManager.getSecureEnvVar('MISSING_VAR', true);
    }).toThrow('Required environment variable MISSING_VAR is not set or empty');
  });

  test('should validate Perplexity API key format', () => {
    process.env.PERPLEXITY_API_KEY = 'pplx-validkeyformat123456789';
    const result = envManager.getSecureEnvVar('PERPLEXITY_API_KEY');
    expect(result).toBe('pplx-validkeyformat123456789');
  });

  test('should reject invalid Perplexity API key format', () => {
    process.env.PERPLEXITY_API_KEY = 'invalid-key';
    expect(() => {
      envManager.getSecureEnvVar('PERPLEXITY_API_KEY');
    }).toThrow('Invalid Perplexity API key format');
  });
});

describe('InputSanitizer', () => {
  test('should sanitize valid message', () => {
    const message = 'Hello, I need help with anxiety.';
    const result = InputSanitizer.sanitizeMessage(message);
    expect(result).toBe(message);
  });

  test('should remove script tags', () => {
    const message = 'Hello <script>alert("xss")</script> world';
    const result = InputSanitizer.sanitizeMessage(message);
    expect(result).toBe('Hello  world');
  });

  test('should remove javascript protocol', () => {
    const message = 'Click javascript: alert("xss") here';
    const result = InputSanitizer.sanitizeMessage(message);
    expect(result).toBe('Click  here');
  });

  test('should remove event handlers', () => {
    const message = 'Hello <div onclick="alert()">world</div>';
    const result = InputSanitizer.sanitizeMessage(message);
    expect(result).toBe('Hello <div >world</div>');
  });

  test('should reject messages that are too long', () => {
    const longMessage = 'a'.repeat(2001);
    expect(() => {
      InputSanitizer.sanitizeMessage(longMessage);
    }).toThrow('Message exceeds maximum length of 2000 characters');
  });

  test('should sanitize valid session ID', () => {
    const sessionId = 'guest_abc123_def456';
    const result = InputSanitizer.sanitizeSessionId(sessionId);
    expect(result).toBe(sessionId);
  });

  test('should remove invalid characters from session ID', () => {
    const sessionId = 'guest_abc123_def456!@#$%';
    const result = InputSanitizer.sanitizeSessionId(sessionId);
    expect(result).toBe('guest_abc123_def456');
  });
});

describe('HTTPSEnforcer', () => {
  test('should return security headers', () => {
    const headers = HTTPSEnforcer.getSecurityHeaders();
    
    expect(headers).toHaveProperty('Strict-Transport-Security');
    expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
    expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
    expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
    expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(headers).toHaveProperty('Content-Security-Policy');
    
    // Verify CSP includes necessary directives
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://api.perplexity.ai');
  });

  test('should allow HTTPS in production', () => {
    process.env.NODE_ENV = 'production';
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('https')
      }
    } as any;

    expect(() => {
      HTTPSEnforcer.enforceHTTPS(mockRequest);
    }).not.toThrow();
  });

  test('should reject HTTP in production', () => {
    process.env.NODE_ENV = 'production';
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('http')
      }
    } as any;

    expect(() => {
      HTTPSEnforcer.enforceHTTPS(mockRequest);
    }).toThrow('HTTPS is required in production');
  });
});

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = SessionManager.getInstance();
    sessionManager.clearAllSessions();
    sessionManager.stopCleanupTimer();
  });

  afterEach(() => {
    sessionManager.clearAllSessions();
    sessionManager.stopCleanupTimer();
  });

  test('should store and retrieve session data', () => {
    const sessionId = 'test_session_123';
    const data = {
      conversationHistory: ['Hello', 'Hi there'],
      emotionData: { dominant: 'happy', confidence: 0.8 }
    };

    sessionManager.storeSessionData(sessionId, data);
    const retrieved = sessionManager.getSessionData(sessionId);

    expect(retrieved).toBeTruthy();
    expect(retrieved?.sessionId).toBe(sessionId);
    expect(retrieved?.conversationHistory).toEqual(data.conversationHistory);
    expect(retrieved?.emotionData).toEqual(data.emotionData);
  });

  test('should return null for non-existent session', () => {
    const result = sessionManager.getSessionData('non_existent');
    expect(result).toBeNull();
  });

  test('should remove session data', () => {
    const sessionId = 'test_session_456';
    sessionManager.storeSessionData(sessionId, { conversationHistory: [] });
    
    const removed = sessionManager.removeSession(sessionId);
    expect(removed).toBe(true);
    
    const retrieved = sessionManager.getSessionData(sessionId);
    expect(retrieved).toBeNull();
  });

  test('should track session count', () => {
    expect(sessionManager.getSessionCount()).toBe(0);
    
    sessionManager.storeSessionData('session1', { conversationHistory: [] });
    expect(sessionManager.getSessionCount()).toBe(1);
    
    sessionManager.storeSessionData('session2', { conversationHistory: [] });
    expect(sessionManager.getSessionCount()).toBe(2);
    
    sessionManager.removeSession('session1');
    expect(sessionManager.getSessionCount()).toBe(1);
  });
});