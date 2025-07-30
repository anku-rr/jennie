'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, EmotionData } from '@/types';
import { chatAPI, ChatAPIError } from '@/lib/api';
import { AppError, ErrorHandler } from '@/lib/errorHandling';

interface ConversationManagerState {
  messages: Message[];
  isTyping: boolean;
  error: AppError | null;
  isRetrying: boolean;
}

interface ConversationManagerActions {
  addMessage: (content: string, sender: 'user' | 'jennie', emotionContext?: EmotionData) => void;
  sendMessage: (content: string, sessionId: string, emotionContext?: EmotionData) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export type ConversationManager = ConversationManagerState & ConversationManagerActions;

export const useConversationManager = (): ConversationManager => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Store last message details for retry functionality
  const lastMessageRef = useRef<{
    content: string;
    sessionId: string;
    emotionContext?: EmotionData;
  } | null>(null);

  const addMessage = useCallback((
    content: string, 
    sender: 'user' | 'jennie', 
    emotionContext?: EmotionData
  ) => {
    const newMessage: any = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      sender,
      timestamp: new Date().toISOString()
    };
    
    if (emotionContext) {
      newMessage.emotionContext = emotionContext;
    }

    setMessages(prev => [...prev, newMessage]);
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    sessionId: string,
    emotionContext?: EmotionData
  ) => {
    // Store for potential retry
    const lastMessage: any = { content, sessionId };
    if (emotionContext) {
      lastMessage.emotionContext = emotionContext;
    }
    lastMessageRef.current = lastMessage;
    
    // Clear any previous errors
    setError(null);
    
    // Add user message immediately
    addMessage(content, 'user', emotionContext);
    
    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to API
      const response = await chatAPI.sendMessage(
        content,
        sessionId,
        messages,
        emotionContext
      );

      // Add Jennie's response
      addMessage(response.response, 'jennie');
      
      // Clear last message ref on success
      lastMessageRef.current = null;
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Convert to AppError
      const appError = ErrorHandler.fromChatAPIError(err);
      ErrorHandler.logError(appError, 'ConversationManager.sendMessage');
      
      setError(appError);
      
      // Add error message as Jennie's response only if not retryable
      if (!appError.retryable) {
        addMessage(appError.userMessage, 'jennie');
        lastMessageRef.current = null;
      }
    } finally {
      setIsTyping(false);
    }
  }, [messages, addMessage]);

  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current || isRetrying) return;
    
    setIsRetrying(true);
    setError(null);
    
    const { content, sessionId, emotionContext } = lastMessageRef.current;
    
    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to API
      const response = await chatAPI.sendMessage(
        content,
        sessionId,
        messages,
        emotionContext
      );

      // Add Jennie's response
      addMessage(response.response, 'jennie');
      
      // Clear last message ref on success
      lastMessageRef.current = null;
    } catch (err) {
      console.error('Failed to retry message:', err);
      
      // Convert to AppError
      const appError = ErrorHandler.fromChatAPIError(err);
      ErrorHandler.logError(appError, 'ConversationManager.retryLastMessage');
      
      setError(appError);
      
      // Add error message as Jennie's response if not retryable
      if (!appError.retryable) {
        addMessage(appError.userMessage, 'jennie');
        lastMessageRef.current = null;
      }
    } finally {
      setIsTyping(false);
      setIsRetrying(false);
    }
  }, [messages, addMessage, isRetrying]);

  const setTyping = useCallback((typing: boolean) => {
    setIsTyping(typing);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    lastMessageRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    lastMessageRef.current = null;
  }, []);

  return {
    messages,
    isTyping,
    error,
    isRetrying,
    addMessage,
    sendMessage,
    retryLastMessage,
    setTyping,
    clearMessages,
    clearError
  };
};