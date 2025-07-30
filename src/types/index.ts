// Core data types for the AI therapist application

export type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'fearful' | 'disgusted';

export interface EmotionData {
  dominant: EmotionType;
  confidence: number;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
    fearful: number;
    disgusted: number;
  };
  timestamp: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'jennie';
  timestamp: string;
  emotionContext?: EmotionData;
}

export interface Session {
  id: string;
  type: 'guest';
  createdAt: string;
  expiresAt: string;
  conversationHistory: Message[];
}

// API Request/Response types
export interface ChatRequest {
  message: string;
  sessionId: string;
  emotionContext?: EmotionData;
  conversationHistory: Message[];
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
}

export interface SessionRequest {
  type: 'guest';
}

export interface SessionResponse {
  sessionId: string;
  expiresAt: string;
}

// Webcam related types
export interface WebcamError {
  type: 'permission_denied' | 'not_found' | 'not_readable' | 'overconstrained' | 'unknown';
  message: string;
}

export interface WebcamState {
  isActive: boolean;
  hasPermission: boolean | null;
  error: WebcamError | null;
  stream: MediaStream | null;
}