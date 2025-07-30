import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders when visible is true', () => {
    render(<TypingIndicator isVisible={true} />);
    
    expect(screen.getByText('Jennie')).toBeInTheDocument();
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(<TypingIndicator isVisible={false} />);
    
    expect(screen.queryByText('Jennie')).not.toBeInTheDocument();
    expect(screen.queryByText('typing...')).not.toBeInTheDocument();
  });

  it('displays animated dots', () => {
    const { container } = render(<TypingIndicator isVisible={true} />);
    
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('applies correct styling for Jennie messages', () => {
    const { container } = render(<TypingIndicator isVisible={true} />);
    
    const bubble = container.querySelector('.bg-gray-100');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveClass('rounded-bl-md');
  });
});