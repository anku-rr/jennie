/**
 * Security utilities for the AI therapist application
 */

/**
 * Secure environment variable access with validation
 */
export class SecureEnvManager {
  private static instance: SecureEnvManager;
  private envCache = new Map<string, string>();

  private constructor() {}

  public static getInstance(): SecureEnvManager {
    if (!SecureEnvManager.instance) {
      SecureEnvManager.instance = new SecureEnvManager();
    }
    return SecureEnvManager.instance;
  }

  /**
   * Securely retrieve environment variable with validation
   */
  public getSecureEnvVar(key: string, required = true): string | null {
    // Check cache first
    if (this.envCache.has(key)) {
      return this.envCache.get(key)!;
    }

    const value = process.env[key];

    if (required && (!value || value.trim() === '')) {
      throw new Error(`Required environment variable ${key} is not set or empty`);
    }

    if (value) {
      // Validate API key format for known services
      if (key.includes('API_KEY')) {
        this.validateApiKeyFormat(key, value);
      }

      // Cache the validated value
      this.envCache.set(key, value);
      return value;
    }

    return null;
  }

  /**
   * Validate API key formats for security
   */
  private validateApiKeyFormat(keyName: string, value: string): void {
    if (keyName === 'PERPLEXITY_API_KEY') {
      // Perplexity API keys start with 'pplx-'
      if (!value.startsWith('pplx-') || value.length < 20) {
        throw new Error('Invalid Perplexity API key format');
      }
    }

    // Check for common security issues
    if (value.includes(' ') || value.includes('\n') || value.includes('\t')) {
      throw new Error(`API key ${keyName} contains invalid characters`);
    }
  }

  /**
   * Clear environment cache (useful for testing)
   */
  public clearCache(): void {
    this.envCache.clear();
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  // Maximum message length to prevent abuse
  private static readonly MAX_MESSAGE_LENGTH = 2000;
  
  // Patterns to detect and remove potentially harmful content
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript\s*:\s*[^"\s]*(?:"[^"]*")?[^"\s]*/gi, // JavaScript protocol with optional quoted content
    /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers with quotes
    /on\w+\s*=\s*[^"'\s>]+/gi, // Event handlers without quotes
    /<iframe\b[^>]*>/gi, // Iframe tags
    /<object\b[^>]*>/gi, // Object tags
    /<embed\b[^>]*>/gi, // Embed tags
    /<img\b[^>]*>/gi, // Image tags (can be used for XSS)
  ];

  /**
   * Sanitize user input message
   */
  public static sanitizeMessage(message: string): string {
    if (typeof message !== 'string') {
      throw new Error('Message must be a string');
    }

    // Check length
    if (message.length > this.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`);
    }

    // Remove dangerous patterns
    let sanitized = message;
    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Ensure message is not empty after sanitization
    if (sanitized.length === 0) {
      throw new Error('Message is empty after sanitization');
    }

    return sanitized;
  }

  /**
   * Sanitize session ID
   */
  public static sanitizeSessionId(sessionId: string): string {
    if (typeof sessionId !== 'string') {
      throw new Error('Session ID must be a string');
    }

    // Session IDs should only contain alphanumeric characters, hyphens, and underscores
    const sanitized = sessionId.replace(/[^a-zA-Z0-9-_]/g, '');
    
    if (sanitized.length === 0 || sanitized.length > 100) {
      throw new Error('Invalid session ID format');
    }

    return sanitized;
  }
}

/**
 * HTTPS enforcement utilities
 */
export class HTTPSEnforcer {
  /**
   * Check if request is using HTTPS in production
   */
  public static enforceHTTPS(request: Request): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    
    if (isProduction && protocol !== 'https') {
      throw new Error('HTTPS is required in production');
    }
  }

  /**
   * Get secure headers for responses
   */
  public static getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://api.perplexity.ai;",
    };
  }
}