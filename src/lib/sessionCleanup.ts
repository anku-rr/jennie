/**
 * Session cleanup utilities for managing temporary data
 */

interface SessionData {
  sessionId: string;
  lastActivity: number;
  conversationHistory: any[];
  emotionData?: any;
}

/**
 * In-memory session store with automatic cleanup
 */
export class SessionManager {
  private static instance: SessionManager;
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Session timeout: 30 minutes of inactivity
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  
  // Cleanup interval: every 5 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Store session data temporarily
   */
  public storeSessionData(sessionId: string, data: Partial<SessionData>): void {
    const existing = this.sessions.get(sessionId);
    const sessionData: SessionData = {
      sessionId,
      lastActivity: Date.now(),
      conversationHistory: [],
      ...existing,
      ...data,
    };
    
    this.sessions.set(sessionId, sessionData);
  }

  /**
   * Retrieve session data
   */
  public getSessionData(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update last activity
      session.lastActivity = Date.now();
      return session;
    }
    return null;
  }

  /**
   * Remove specific session data
   */
  public removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedCount++;
        console.log(`Cleaned up expired session: ${sessionId}`);
      }
    }

    return cleanedCount;
  }

  /**
   * Get current session count
   */
  public getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (for testing or emergency cleanup)
   */
  public clearAllSessions(): void {
    this.sessions.clear();
    console.log('All sessions cleared');
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`Automatic cleanup: removed ${cleaned} expired sessions`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop cleanup timer (for testing or shutdown)
   */
  public stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Client-side session cleanup utilities
 */
export class ClientSessionCleanup {
  /**
   * Clear sensitive data from localStorage
   */
  public static clearLocalStorage(): void {
    try {
      localStorage.removeItem('therapist_session');
      localStorage.removeItem('conversation_history');
      localStorage.removeItem('emotion_data');
      console.log('Local storage cleared');
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }

  /**
   * Clear sensitive data from sessionStorage
   */
  public static clearSessionStorage(): void {
    try {
      sessionStorage.removeItem('temp_emotion_data');
      sessionStorage.removeItem('temp_conversation');
      console.log('Session storage cleared');
    } catch (error) {
      console.error('Failed to clear session storage:', error);
    }
  }

  /**
   * Clear all temporary data
   */
  public static clearAllTemporaryData(): void {
    this.clearLocalStorage();
    this.clearSessionStorage();
  }

  /**
   * Set up automatic cleanup on page unload
   */
  public static setupAutoCleanup(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearSessionStorage();
      });

      // Clear temporary data on visibility change (when tab becomes hidden)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.clearSessionStorage();
        }
      });
    }
  }
}