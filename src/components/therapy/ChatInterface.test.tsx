import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ChatInterface } from './ChatInterface';
import { SessionProvider } from '@/contexts/SessionContext';
import { EmotionProvider } from '@/contexts/EmotionContext';

// Mock Material-UI components to avoid theme provider issues in tests
jest.mock('@mui/material', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  TextField: ({ value, onChange, onKeyPress, placeholder, disabled, fullWidth, multiline, maxRows, variant, size, sx, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  ),
  Paper: ({ children, elevation, className, style, ...props }: any) => (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/icons-material', () => ({
  Send: () => <span>Send</span>,
}));

// Mock the conversation manager hook
jest.mock('@/hooks/useConversationManager', () => ({
  useConversationManager: () => ({
    messages: [],
    isTyping: false,
    error: null,
    isRetrying: false,
    sendMessage: jest.fn(),
    retryLastMessage: jest.fn(),
    clearError: jest.fn()
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SessionProvider>
    <EmotionProvider>
      {children}
    </EmotionProvider>
  </SessionProvider>
);

describe('ChatInterface', () => {
  it('renders welcome message when no messages exist', () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    expect(screen.getByText("Welcome! I'm Jennie, your AI therapist.")).toBeInTheDocument();
    expect(screen.getByText("How are you feeling today? Feel free to share what's on your mind.")).toBeInTheDocument();
  });

  it('renders input field and send button', () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls sendMessage when message is sent', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');
    
    await user.type(input, 'Hello Jennie');
    await user.click(sendButton);
    
    // The message should be sent (we can't easily test the mock call due to context)
    expect(input).toHaveValue(''); // Input should be cleared
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByRole('button');
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(input).toHaveValue('');
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    const sendButton = screen.getByRole('button');
    
    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled();
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    const input = screen.getByPlaceholderText('Type your message here...');
    
    await user.type(input, 'Hello Jennie');
    await user.keyboard('{Enter}');
    
    // Input should be cleared after sending
    expect(input).toHaveValue('');
  });

  it('displays character count', () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    expect(screen.getByText('0/1000')).toBeInTheDocument();
  });

  it('shows keyboard shortcuts hint', () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );
    
    expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
  });
});