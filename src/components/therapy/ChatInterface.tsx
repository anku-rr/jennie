'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, TextField, Paper, Alert } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useSession } from '@/contexts/SessionContext';
import { useEmotionContext } from '@/contexts/EmotionContext';
import { logApiContextSent } from '@/utils/emotionDebug';

interface ChatInterfaceProps {
  disabled?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  disabled = false 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isTyping, 
    error, 
    isRetrying,
    sendMessage, 
    retryLastMessage,
    clearError 
  } = useConversationManager();
  const { session } = useSession();
  const { getRecentEmotionTrend, isEmotionDetectionActive } = useEmotionContext();

  // Auto-scroll to bottom when new messages arrive with performance monitoring
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      const startTime = performance.now();
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      const scrollTime = performance.now() - startTime;
      
      // Record scroll performance if monitoring is available
      if (typeof window !== 'undefined' && (window as any).performanceMonitor) {
        (window as any).performanceMonitor.recordChatPerformance(0, scrollTime, 0);
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || disabled || isTyping || isRetrying || !session) return;

    const messageContent = inputMessage.trim();
    
    // Validate message length
    if (messageContent.length > 1000) {
      // Could add a validation error here
      return;
    }
    
    setInputMessage('');
    
    // Clear any previous errors
    if (error) {
      clearError();
    }
    
    // Get current emotion context if available
    const emotionTrend = isEmotionDetectionActive ? getRecentEmotionTrend() : null;
    const emotionContext = emotionTrend || undefined;
    
    // Log emotion context being sent to API
    logApiContextSent(emotionContext);
    
    // Send message through the conversation manager
    await sendMessage(messageContent, session.id, emotionContext);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full max-w-4xl mx-auto">
      {/* Error Display */}
      {error && (() => {
        const errorProps: any = {
          error,
          onDismiss: clearError,
          variant: "banner",
          showDetails: process.env.NODE_ENV === 'development',
          className: "mb-4"
        };
        
        if (error.retryable) {
          errorProps.onRetry = retryLastMessage;
        }
        
        return <ErrorDisplay {...errorProps} />;
      })()}

      {/* Session Status */}
      {!session && (
        <Alert 
          severity="warning" 
          className="mb-4"
        >
          Please create a session to start chatting with Jennie.
        </Alert>
      )}

      {/* Retry Loading State */}
      {isRetrying && (
        <div className="mb-4">
          <LoadingIndicator 
            message="Retrying your message..." 
            size="small"
            variant="dots"
          />
        </div>
      )}

      {/* Messages container */}
      <Paper 
        elevation={1} 
        className="flex-1 overflow-y-auto p-4 mb-4 bg-white rounded-lg transition-all duration-300 ease-in-out"
        style={{ minHeight: '400px' }}
      >
        <div className="space-y-2">
          {messages.length === 0 && session && (
            <div className="text-center text-gray-500 py-8 animate-fade-in">
              <p className="text-lg animate-slide-up">Welcome! I&apos;m Jennie, your AI therapist.</p>
              <p className="text-sm mt-2 animate-slide-up animation-delay-200">How are you feeling today? Feel free to share what&apos;s on your mind.</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div 
              key={message.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MessageBubble message={message} />
            </div>
          ))}
          
          <TypingIndicator isVisible={isTyping} />
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </Paper>

      {/* Input area */}
      <Paper elevation={2} className="p-4 bg-white rounded-lg transition-all duration-200 ease-in-out hover:shadow-lg">
        <div className="flex gap-2 items-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={disabled}
            variant="outlined"
            size="small"
            className="flex-1 transition-all duration-200 ease-in-out"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
                '&.Mui-focused': {
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || disabled || isTyping || isRetrying || !session}
            className="transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
            sx={{
              minWidth: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              },
              '&:disabled': {
                transform: 'none',
              }
            }}
          >
            <SendIcon className="transition-transform duration-200 ease-in-out" />
          </Button>
        </div>
        
        {/* Character count and hints */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 transition-opacity duration-200 ease-in-out">
          <span className="animate-fade-in">Press Enter to send, Shift+Enter for new line</span>
          <span className={`transition-colors duration-200 ${inputMessage.length > 900 ? 'text-orange-500' : inputMessage.length > 950 ? 'text-red-500' : ''}`}>
            {inputMessage.length}/1000
          </span>
        </div>
      </Paper>
    </div>
  );
};