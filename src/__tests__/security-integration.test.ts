/**
 * Security integration tests to verify all security measures work together
 */

import { SecureEnvManager, InputSanitizer, HTTPSEnforcer } from '@/lib/security';
import { SessionManager, ClientSessionCleanup } from '@/lib/sessionCleanup';

describe('Security Integration Tests', () => {
  let sessionManager: SessionManager;
  let envManager: SecureEnvManager;

  beforeEach(() => {
    sessionManager = SessionManager.getInstance();
    sessionManager.clearAllSessions();
    sessionManager.stopCleanupTimer();
    
    envManager = SecureEnvManager.getInstance();
    envManager.clearCache();
    
    // Set up test environment
    process.env.PERPLEXITY_API_KEY = 'pplx-test-key-12345678901234567890';
  });

  afterEach(() => {
    sessionManager.clearAllSessions();
    sessionManager.stopCleanupTimer();
  });

  test('should handle complete secure chat flow', () => {
    // 1. Sanitize user input
    const userMessage = 'I feel anxious <script>alert("xss")</script> about my job';
    const sanitizedMessage = InputSanitizer.sanitizeMessage(userMessage);
    expect(sanitizedMessage).toBe('I feel anxious  about my job');

    // 2. Sanitize session ID
    const rawSessionId = 'guest_123_abc!@#';
    const sanitizedSessionId = InputSanitizer.sanitizeSessionId(rawSessionId);
    expect(sanitizedSessionId).toBe('guest_123_abc');

    // 3. Store session data securely
    sessionManager.storeSessionData(sanitizedSessionId, {
      conversationHistory: [sanitizedMessage],
      emotionData: { dominant: 'anxious', confidence: 0.7 }
    });

    // 4. Retrieve session data
    const sessionData = sessionManager.getSessionData(sanitizedSessionId);
    expect(sessionData).toBeTruthy();
    expect(sessionData?.conversationHistory).toEqual([sanitizedMessage]);

    // 5. Get secure API key
    const apiKey = envManager.getSecureEnvVar('PERPLEXITY_API_KEY');
    expect(apiKey).toBe('pplx-test-key-12345678901234567890');

    // 6. Get security headers
    const headers = HTTPSEnforcer.getSecurityHeaders();
    expect(headers).toHaveProperty('Content-Security-Policy');
    expect(headers['Content-Security-Policy']).toContain('https://api.perplexity.ai');
  });

  test('should prevent XSS attacks in conversation flow', () => {
    const maliciousInputs = [
      { input: '<script>document.cookie="stolen"</script>Hello', expected: 'Hello' },
      { input: 'Hello <div onclick="steal()">click me</div>', expected: 'Hello <div >click me</div>' },
      { input: 'I need help <img src="x" onerror="alert(1)"> with anxiety', expected: 'I need help  with anxiety' }
    ];

    const sessionId = 'test_session_xss';

    maliciousInputs.forEach(({ input, expected }) => {
      const sanitized = InputSanitizer.sanitizeMessage(input);
      expect(sanitized).toBe(expected);
      
      // Store sanitized message
      sessionManager.storeSessionData(sessionId, {
        conversationHistory: [sanitized]
      });

      const retrieved = sessionManager.getSessionData(sessionId);
      const storedMessage = retrieved?.conversationHistory[0] || '';

      // Verify no dangerous content remains
      expect(storedMessage).not.toContain('<script');
      expect(storedMessage).not.toContain('javascript:');
      expect(storedMessage).not.toContain('onclick=');
      expect(storedMessage).not.toContain('<iframe');
      expect(storedMessage).not.toContain('onerror=');
    });

    // Test inputs that become empty after sanitization
    const emptyAfterSanitization = [
      '<script>alert("xss")</script>'
    ];

    emptyAfterSanitization.forEach(input => {
      expect(() => {
        InputSanitizer.sanitizeMessage(input);
      }).toThrow('Message is empty after sanitization');
    });

    // Test other dangerous inputs that get sanitized but may not be empty
    const dangerousInputs = [
      { input: 'javascript:alert("xss")', shouldNotContain: ['javascript:', 'alert'] },
      { input: '<iframe src="javascript:alert(1)"></iframe>', shouldNotContain: ['<iframe', 'javascript:', 'alert'] }
    ];

    dangerousInputs.forEach(({ input, shouldNotContain }) => {
      try {
        const result = InputSanitizer.sanitizeMessage(input);
        shouldNotContain.forEach(dangerous => {
          expect(result).not.toContain(dangerous);
        });
      } catch (error) {
        // If the input becomes empty after sanitization, that's also acceptable
        expect(error.message).toBe('Message is empty after sanitization');
      }
    });
  });

  test('should handle session cleanup securely', () => {
    const sessionIds = ['session1', 'session2', 'session3'];
    
    // Create multiple sessions
    sessionIds.forEach(id => {
      sessionManager.storeSessionData(id, {
        conversationHistory: [`Message from ${id}`],
        emotionData: { dominant: 'neutral', confidence: 0.5 }
      });
    });

    expect(sessionManager.getSessionCount()).toBe(3);

    // Simulate expired sessions by manually setting old timestamps
    sessionIds.forEach(id => {
      const session = sessionManager.getSessionData(id);
      if (session) {
        session.lastActivity = Date.now() - (31 * 60 * 1000); // 31 minutes ago
      }
    });

    // Clean up expired sessions
    const cleanedCount = sessionManager.cleanupExpiredSessions();
    expect(cleanedCount).toBe(3);
    expect(sessionManager.getSessionCount()).toBe(0);

    // Verify sessions are actually removed
    sessionIds.forEach(id => {
      expect(sessionManager.getSessionData(id)).toBeNull();
    });
  });

  test('should validate environment variables securely', () => {
    // Test valid API key
    process.env.PERPLEXITY_API_KEY = 'pplx-valid-key-format-123456789';
    expect(() => {
      envManager.getSecureEnvVar('PERPLEXITY_API_KEY');
    }).not.toThrow();

    // Test invalid API key formats
    const invalidKeys = [
      'invalid-key',
      'pplx-',
      'pplx-short',
      'pplx-key with spaces',
      'pplx-key\nwith\nnewlines'
    ];

    invalidKeys.forEach(key => {
      process.env.PERPLEXITY_API_KEY = key;
      envManager.clearCache(); // Clear cache to force re-validation
      
      expect(() => {
        envManager.getSecureEnvVar('PERPLEXITY_API_KEY');
      }).toThrow();
    });
  });

  test('should enforce HTTPS in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    
    try {
      // Test production environment
      process.env.NODE_ENV = 'production';
      
      const httpRequest = {
        headers: {
          get: jest.fn().mockReturnValue('http')
        }
      } as any;

      const httpsRequest = {
        headers: {
          get: jest.fn().mockReturnValue('https')
        }
      } as any;

      // Should reject HTTP in production
      expect(() => {
        HTTPSEnforcer.enforceHTTPS(httpRequest);
      }).toThrow('HTTPS is required in production');

      // Should allow HTTPS in production
      expect(() => {
        HTTPSEnforcer.enforceHTTPS(httpsRequest);
      }).not.toThrow();

      // Test development environment
      process.env.NODE_ENV = 'development';
      
      // Should allow HTTP in development
      expect(() => {
        HTTPSEnforcer.enforceHTTPS(httpRequest);
      }).not.toThrow();

    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('should handle edge cases in input sanitization', () => {
    // Test empty and whitespace-only inputs
    expect(() => {
      InputSanitizer.sanitizeMessage('');
    }).toThrow('Message is empty after sanitization');

    expect(() => {
      InputSanitizer.sanitizeMessage('   ');
    }).toThrow('Message is empty after sanitization');

    // Test very long inputs
    const longMessage = 'a'.repeat(2000); // At the limit
    expect(() => {
      InputSanitizer.sanitizeMessage(longMessage);
    }).not.toThrow();

    const tooLongMessage = 'a'.repeat(2001); // Over the limit
    expect(() => {
      InputSanitizer.sanitizeMessage(tooLongMessage);
    }).toThrow('Message exceeds maximum length');

    // Test complex nested attacks
    const complexAttack = '<script>alert(<script>alert("nested")</script>)</script>';
    const sanitized = InputSanitizer.sanitizeMessage(complexAttack);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert');
  });

  test('should generate secure session IDs', () => {
    // Test session ID generation (simulating the session API)
    const generateSecureSessionId = (): string => {
      const timestamp = Date.now().toString(36);
      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      const randomPart = Array.from(randomBytes, byte => byte.toString(36)).join('').substring(0, 15);
      return `guest_${timestamp}_${randomPart}`;
    };

    const sessionIds = Array.from({ length: 10 }, () => generateSecureSessionId());
    
    // All session IDs should be unique
    const uniqueIds = new Set(sessionIds);
    expect(uniqueIds.size).toBe(10);

    // All session IDs should follow the expected format
    sessionIds.forEach(id => {
      expect(id).toMatch(/^guest_[a-z0-9]+_[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(20); // Should be reasonably long
    });

    // Session IDs should pass sanitization
    sessionIds.forEach(id => {
      const sanitized = InputSanitizer.sanitizeSessionId(id);
      expect(sanitized).toBe(id); // Should not change
    });
  });
});