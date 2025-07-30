'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, SessionRequest, SessionResponse } from '@/types';
import { ClientSessionCleanup } from '@/lib/sessionCleanup';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  createGuestSession: () => Promise<void>;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount and setup cleanup
  useEffect(() => {
    // Setup automatic cleanup
    ClientSessionCleanup.setupAutoCleanup();

    const savedSession = localStorage.getItem('therapist_session');
    if (savedSession) {
      try {
        const parsedSession: Session = JSON.parse(savedSession);
        
        // Check if session is still valid
        if (new Date(parsedSession.expiresAt) > new Date()) {
          setSession(parsedSession);
        } else {
          // Session expired, clear it
          ClientSessionCleanup.clearLocalStorage();
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        ClientSessionCleanup.clearLocalStorage();
      }
    }
  }, []);

  const createGuestSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: SessionRequest = { type: 'guest' };
      
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const sessionResponse: SessionResponse = await response.json();
      
      const newSession: Session = {
        id: sessionResponse.sessionId,
        type: 'guest',
        createdAt: new Date().toISOString(),
        expiresAt: sessionResponse.expiresAt,
        conversationHistory: [],
      };

      setSession(newSession);
      localStorage.setItem('therapist_session', JSON.stringify(newSession));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Session creation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    setSession(null);
    setError(null);
    // Use secure cleanup instead of direct localStorage removal
    ClientSessionCleanup.clearAllTemporaryData();
  };

  const value: SessionContextType = {
    session,
    isLoading,
    error,
    createGuestSession,
    clearSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}