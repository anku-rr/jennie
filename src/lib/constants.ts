// Application constants

export const APP_CONFIG = {
  name: 'Jennie - AI Therapist',
  description: 'AI-driven online therapy with emotion detection',
  version: '1.0.0',
} as const;

export const API_ENDPOINTS = {
  chat: '/api/chat',
  session: '/api/session',
} as const;

export const EMOTION_TYPES = [
  'happy',
  'sad', 
  'angry',
  'surprised',
  'neutral',
  'fearful',
  'disgusted'
] as const;

export const SESSION_CONFIG = {
  guestSessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  maxConversationHistory: 100,
} as const;