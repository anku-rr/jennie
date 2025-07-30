import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';

describe('MessageBubble', () => {
  const mockUserMessage: Message = {
    id: '1',
    content: 'Hello, how are you?',
    sender: 'user',
    timestamp: '2024-01-01T12:00:00Z',
  };

  const mockJennieMessage: Message = {
    id: '2',
    content: 'Hello! I\'m doing well, thank you for asking. How are you feeling today?',
    sender: 'jennie',
    timestamp: '2024-01-01T12:01:00Z',
  };

  it('renders user message with correct styling', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('div');
    expect(messageContainer).toHaveClass('bg-blue-500', 'text-white');
  });

  it('renders Jennie message with correct styling', () => {
    render(<MessageBubble message={mockJennieMessage} />);
    
    expect(screen.getByText('Hello! I\'m doing well, thank you for asking. How are you feeling today?')).toBeInTheDocument();
    expect(screen.getByText('Jennie')).toBeInTheDocument();
    
    const messageContainer = screen.getByText('Hello! I\'m doing well, thank you for asking. How are you feeling today?').closest('div');
    expect(messageContainer).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('displays formatted timestamp', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    // The timestamp should be formatted as HH:MM (check for any time format)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('handles multiline content correctly', () => {
    const multilineMessage: Message = {
      ...mockUserMessage,
      content: 'Line 1\nLine 2\nLine 3',
    };
    
    render(<MessageBubble message={multilineMessage} />);
    
    // Check that the content is rendered with proper whitespace handling
    const messageElement = screen.getByText(/Line 1/);
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.textContent).toContain('Line 1');
    expect(messageElement.textContent).toContain('Line 2');
    expect(messageElement.textContent).toContain('Line 3');
  });

  it('applies correct alignment for user messages', () => {
    const { container } = render(<MessageBubble message={mockUserMessage} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('justify-end');
  });

  it('applies correct alignment for Jennie messages', () => {
    const { container } = render(<MessageBubble message={mockJennieMessage} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('justify-start');
  });
});