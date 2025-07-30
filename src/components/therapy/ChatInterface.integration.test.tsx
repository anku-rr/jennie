import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from './ChatInterface';
import { SessionProvider } from '@/contexts/SessionContext';
import { EmotionContextProvider } from '@/contexts/EmotionContext';
import { EmotionData } from '@/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  chatAPI: {
    sendMessage: jest.fn()
  },
  ChatAPIError: class extends Error {
    constructor(message: string, public status: number, public code?: string) {
      super(message);
    }
  }
}));

// Mock the hooks
const mockUseConversationManager = {
  messages: [],
  isTyping: false,
  error: null,
  sendMessage: jest.fn(),
  clearError: jest.fn()
};

const mockUseSession = {
  session: {
    id: 'test-session-id',
    type: 'guest' as const,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    conversationHistory: []
  }
};

const mockUseEmotionContext = {
  currentEmotion: null as EmotionData | null,
  emotionHistory: [] as EmotionData[],
  isEmotionDetectionActive: false,
  updateEmotion: jest.fn(),
  clearEmotionHistory: jest.fn(),
  setEmotionDetectionActive: jest.fn(),
  getRecentEmotionTrend: jest.fn()
};

jest.mock('@/hooks/useConversationManager', () => ({
  useConversationManager: () => mockUseConversationManager
}));

jest.mock('@/contexts/SessionContext', () => ({
  ...jest.requireActual('@/contexts/SessionContext'),
  useSession: () => mockUseSession
}));

jest.mock('@/contexts/EmotionContext', () => ({
  ...jest.requireActual('@/contexts/EmotionContext'),
  useEmotionContext: () => mockUseEmotionContext
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SessionProvider>
    <EmotionContextProvider>
      {children}
    </EmotionContextProvider>
  </SessionProvider>
);

describe('ChatInterface Integration with Emotion Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConversationManager.messages = [];
    mockUseConversationManager.isTyping = false;
    mockUseConversationManager.error = null;
    mockUseEmotionContext.currentEmotion = null;
    mockUseEmotionContext.isEmotionDetectionActive = false;
  });

  it('should send message without emotion context when detection is inactive', async () => {
    const user = userEvent.setup();
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(null);
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');

    await user.type(input, 'Hello Jennie');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'Hello Jennie',
      'test-session-id',
      undefined // No emotion context
    );
  });

  it('should send message with emotion context when detection is active', async () => {
    const user = userEvent.setup();
    const mockEmotion: EmotionData = {
      dominant: 'happy',
      confidence: 0.8,
      emotions: {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.02,
        neutral: 0.02,
        fearful: 0.01,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };

    mockUseEmotionContext.isEmotionDetectionActive = true;
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(mockEmotion);
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');

    await user.type(input, 'I feel great today!');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'I feel great today!',
      'test-session-id',
      mockEmotion
    );
  });

  it('should handle emotion context changes during conversation', async () => {
    const user = userEvent.setup();
    
    // Start with sad emotion
    const sadEmotion: EmotionData = {
      dominant: 'sad',
      confidence: 0.7,
      emotions: {
        happy: 0.1,
        sad: 0.7,
        angry: 0.1,
        surprised: 0.02,
        neutral: 0.05,
        fearful: 0.02,
        disgusted: 0.01
      },
      timestamp: new Date().toISOString()
    };

    mockUseEmotionContext.isEmotionDetectionActive = true;
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(sadEmotion);
    
    const { rerender } = render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');

    // Send first message with sad emotion
    await user.type(input, 'I am feeling down');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'I am feeling down',
      'test-session-id',
      sadEmotion
    );

    // Change to happy emotion
    const happyEmotion: EmotionData = {
      dominant: 'happy',
      confidence: 0.8,
      emotions: {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.02,
        neutral: 0.02,
        fearful: 0.01,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };

    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(happyEmotion);
    
    rerender(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Send second message with happy emotion
    await user.clear(input);
    await user.type(input, 'Actually, I feel better now');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'Actually, I feel better now',
      'test-session-id',
      happyEmotion
    );
  });

  it('should handle emotion detection being disabled mid-conversation', async () => {
    const user = userEvent.setup();
    const mockEmotion: EmotionData = {
      dominant: 'neutral',
      confidence: 0.6,
      emotions: {
        happy: 0.2,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.02,
        neutral: 0.6,
        fearful: 0.02,
        disgusted: 0.01
      },
      timestamp: new Date().toISOString()
    };

    // Start with emotion detection active
    mockUseEmotionContext.isEmotionDetectionActive = true;
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(mockEmotion);
    
    const { rerender } = render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');

    // Send message with emotion context
    await user.type(input, 'First message');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'First message',
      'test-session-id',
      mockEmotion
    );

    // Disable emotion detection
    mockUseEmotionContext.isEmotionDetectionActive = false;
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(null);
    
    rerender(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Send message without emotion context
    await user.clear(input);
    await user.type(input, 'Second message');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'Second message',
      'test-session-id',
      undefined
    );
  });

  it('should handle null emotion trend gracefully', async () => {
    const user = userEvent.setup();
    
    mockUseEmotionContext.isEmotionDetectionActive = true;
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(null);
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');

    await user.type(input, 'Test message');
    await user.click(sendButton);

    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'Test message',
      'test-session-id',
      null
    );
  });

  it('should clear input after sending message with emotion context', async () => {
    const user = userEvent.setup();
    const mockEmotion: EmotionData = {
      dominant: 'surprised',
      confidence: 0.9,
      emotions: {
        happy: 0.05,
        sad: 0.02,
        angry: 0.01,
        surprised: 0.9,
        neutral: 0.01,
        fearful: 0.01,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };

    mockUseEmotionContext.isEmotionDetectionActive = true;
    mockUseEmotionContext.getRecentEmotionTrend.mockReturnValue(mockEmotion);
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Type your message here...') as HTMLInputElement;
    const sendButton = screen.getByRole('button');

    await user.type(input, 'Wow, that is surprising!');
    expect(input.value).toBe('Wow, that is surprising!');

    await user.click(sendButton);

    expect(input.value).toBe('');
    expect(mockUseConversationManager.sendMessage).toHaveBeenCalledWith(
      'Wow, that is surprising!',
      'test-session-id',
      mockEmotion
    );
  });
});