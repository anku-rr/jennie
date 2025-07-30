import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureUnavailable, ProgressiveFallback } from '@/components/common/GracefulDegradation';

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Alert: ({ children, severity, icon, className, ...props }: any) => (
    <div data-testid="alert" data-severity={severity} className={className} {...props}>
      {icon}
      {children}
    </div>
  ),
  Button: ({ children, onClick, size, variant, sx, ...props }: any) => (
    <button 
      onClick={onClick} 
      data-testid={`button-${variant || 'default'}`}
      {...props}
    >
      {children}
    </button>
  ),
  Box: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  Typography: ({ children, variant, className, ...props }: any) => (
    <div data-variant={variant} className={className} {...props}>
      {children}
    </div>
  )
}));

jest.mock('@mui/icons-material', () => ({
  Warning: () => <span data-testid="warning-icon">Warning</span>,
  Info: () => <span data-testid="info-icon">Info</span>,
  Videocam: () => <span data-testid="videocam-icon">Videocam</span>,
  Psychology: () => <span data-testid="psychology-icon">Psychology</span>
}));

describe('FeatureUnavailable', () => {
  it('renders webcam unavailable message correctly', () => {
    render(<FeatureUnavailable feature="webcam" />);
    
    expect(screen.getByTestId('VideocamIcon')).toBeInTheDocument();
    expect(screen.getByText('Camera Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Camera access is not available/)).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'info');
  });

  it('renders emotion detection unavailable message correctly', () => {
    render(<FeatureUnavailable feature="emotion" />);
    
    expect(screen.getByTestId('PsychologyIcon')).toBeInTheDocument();
    expect(screen.getByText('Emotion Detection Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Emotion detection is temporarily unavailable/)).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'info');
  });

  it('renders AI service unavailable message correctly', () => {
    render(<FeatureUnavailable feature="ai" />);
    
    expect(screen.getByTestId('PsychologyIcon')).toBeInTheDocument();
    expect(screen.getByText('AI Service Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/The AI service is temporarily unavailable/)).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'warning');
  });

  it('renders session unavailable message correctly', () => {
    render(<FeatureUnavailable feature="session" />);
    
    expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
    expect(screen.getByText('Session Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Unable to create or maintain your session/)).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');
  });

  it('displays custom reason when provided', () => {
    const reason = 'Permission denied by user';
    render(<FeatureUnavailable feature="webcam" reason={reason} />);
    
    expect(screen.getByText(`Reason: ${reason}`)).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<FeatureUnavailable feature="webcam" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(<FeatureUnavailable feature="webcam" />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('displays fallback content when provided', () => {
    const fallbackContent = <div data-testid="fallback">Fallback content</div>;
    render(<FeatureUnavailable feature="webcam" fallbackContent={fallbackContent} />);
    
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.getByText('Fallback content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<FeatureUnavailable feature="webcam" className="custom-class" />);
    
    expect(screen.getByTestId('alert')).toHaveClass('custom-class');
  });

  it('handles unknown feature type gracefully', () => {
    // @ts-ignore - Testing unknown feature type
    render(<FeatureUnavailable feature="unknown" />);
    
    expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
    expect(screen.getByText('Feature Unavailable')).toBeInTheDocument();
    expect(screen.getByText('This feature is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'info');
  });
});

describe('ProgressiveFallback', () => {
  const mockChildren = <div data-testid="main-content">Main Content</div>;
  const mockFallback = <div data-testid="fallback-content">Fallback Content</div>;

  it('renders children when condition is true', () => {
    render(
      <ProgressiveFallback
        condition={true}
        feature="webcam"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Camera Unavailable')).not.toBeInTheDocument();
  });

  it('renders FeatureUnavailable with fallback when condition is false', () => {
    render(
      <ProgressiveFallback
        condition={false}
        feature="webcam"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.queryByTestId('main-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.getByText('Camera Unavailable')).toBeInTheDocument();
  });

  it('passes reason to FeatureUnavailable', () => {
    const reason = 'Camera permission denied';
    render(
      <ProgressiveFallback
        condition={false}
        feature="webcam"
        reason={reason}
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByText(`Reason: ${reason}`)).toBeInTheDocument();
  });

  it('passes onRetry to FeatureUnavailable', () => {
    const onRetry = jest.fn();
    render(
      <ProgressiveFallback
        condition={false}
        feature="webcam"
        onRetry={onRetry}
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('works with different feature types', () => {
    const { rerender } = render(
      <ProgressiveFallback
        condition={false}
        feature="emotion"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByText('Emotion Detection Unavailable')).toBeInTheDocument();
    
    rerender(
      <ProgressiveFallback
        condition={false}
        feature="ai"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByText('AI Service Unavailable')).toBeInTheDocument();
    
    rerender(
      <ProgressiveFallback
        condition={false}
        feature="session"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByText('Session Unavailable')).toBeInTheDocument();
  });

  it('toggles between children and fallback based on condition changes', () => {
    const { rerender } = render(
      <ProgressiveFallback
        condition={true}
        feature="webcam"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
    
    rerender(
      <ProgressiveFallback
        condition={false}
        feature="webcam"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.queryByTestId('main-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    
    rerender(
      <ProgressiveFallback
        condition={true}
        feature="webcam"
        fallback={mockFallback}
      >
        {mockChildren}
      </ProgressiveFallback>
    );
    
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
  });
});