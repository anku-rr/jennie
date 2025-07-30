import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorDisplay, ErrorToast } from '@/components/common/ErrorDisplay';
import { AppError } from '@/lib/errorHandling';

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Alert: ({ children, severity, onClose, action, ...props }: any) => (
    <div data-testid="alert" data-severity={severity} {...props}>
      {onClose && (
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
      )}
      {children}
      {action}
    </div>
  ),
  Button: ({ children, onClick, disabled, size, variant, startIcon, endIcon, sx, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid={`button-${variant || 'default'}`}
      {...props}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  ),
  Collapse: ({ children, in: inProp }: any) => (
    <div style={{ display: inProp ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  IconButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="icon-button" {...props}>
      {children}
    </button>
  ),
  Typography: ({ children, variant, className, ...props }: any) => (
    <div data-variant={variant} className={className} {...props}>
      {children}
    </div>
  ),
  Box: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  Snackbar: ({ children, open, onClose, autoHideDuration, anchorOrigin }: any) => (
    <div 
      data-testid="snackbar" 
      style={{ display: open ? 'block' : 'none' }}
      data-auto-hide={autoHideDuration || 'null'}
    >
      {children}
      <button onClick={onClose} data-testid="snackbar-close">Close</button>
    </div>
  )
}));

jest.mock('@mui/icons-material', () => ({
  Close: () => <span>Close</span>,
  Refresh: () => <span>Refresh</span>,
  ExpandMore: () => <span>ExpandMore</span>,
  ExpandLess: () => <span>ExpandLess</span>,
  Warning: () => <span>Warning</span>,
  Error: () => <span>Error</span>,
  Info: () => <span>Info</span>
}));

describe('ErrorDisplay', () => {
  const mockError: AppError = {
    type: 'network',
    message: 'Connection failed',
    code: 'NET_001',
    retryable: true,
    userMessage: 'Connection issue detected. Please check your internet connection and try again.',
    technicalDetails: 'TCP timeout after 30 seconds'
  };

  it('renders error message correctly', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button for non-retryable errors', () => {
    const nonRetryableError: AppError = {
      ...mockError,
      retryable: false
    };
    
    render(<ErrorDisplay error={nonRetryableError} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows technical details when showDetails is true', () => {
    render(<ErrorDisplay error={mockError} showDetails={true} />);
    
    const showDetailsButton = screen.getByText('Show Details');
    expect(showDetailsButton).toBeInTheDocument();
    
    fireEvent.click(showDetailsButton);
    
    expect(screen.getByText('Technical Details:')).toBeInTheDocument();
    expect(screen.getByText(mockError.technicalDetails!)).toBeInTheDocument();
    expect(screen.getByText(`Error Code: ${mockError.code}`)).toBeInTheDocument();
  });

  it('toggles technical details visibility', () => {
    render(<ErrorDisplay error={mockError} showDetails={true} />);
    
    const showDetailsButton = screen.getByText('Show Details');
    fireEvent.click(showDetailsButton);
    
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
    expect(screen.getByText(mockError.technicalDetails!)).toBeInTheDocument();
    
    const hideDetailsButton = screen.getByText('Hide Details');
    fireEvent.click(hideDetailsButton);
    
    expect(screen.getByText('Show Details')).toBeInTheDocument();
    // The technical details should be hidden but the element might still exist in collapsed state
    const technicalDetailsElement = screen.queryByText(mockError.technicalDetails!);
    if (technicalDetailsElement) {
      expect(technicalDetailsElement.closest('[style*="display: none"]')).toBeInTheDocument();
    }
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();
    render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders with correct severity for different error types', () => {
    const { rerender } = render(<ErrorDisplay error={mockError} />);
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');

    const webcamError: AppError = { ...mockError, type: 'webcam' };
    rerender(<ErrorDisplay error={webcamError} />);
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'warning');

    const emotionError: AppError = { ...mockError, type: 'emotion' };
    rerender(<ErrorDisplay error={emotionError} />);
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'warning');

    const validationError: AppError = { ...mockError, type: 'validation' };
    rerender(<ErrorDisplay error={validationError} />);
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'info');
  });

  describe('toast variant', () => {
    it('renders as toast with Snackbar', () => {
      render(<ErrorDisplay error={mockError} variant="toast" />);
      
      expect(screen.getByTestId('snackbar')).toBeInTheDocument();
      expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
    });

    it('shows retry button in toast for retryable errors', () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay error={mockError} variant="toast" onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('auto-hides non-retryable errors', () => {
      const nonRetryableError: AppError = { ...mockError, retryable: false };
      render(<ErrorDisplay error={nonRetryableError} variant="toast" />);
      
      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide', '6000');
    });

    it('does not auto-hide retryable errors', () => {
      render(<ErrorDisplay error={mockError} variant="toast" />);
      
      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide', 'null');
    });
  });

  describe('banner variant', () => {
    it('renders as banner with close button', () => {
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} variant="banner" onDismiss={onDismiss} />);
      
      expect(screen.getByTestId('icon-button')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('icon-button'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});

describe('ErrorToast', () => {
  const mockError: AppError = {
    type: 'api',
    message: 'API Error',
    code: 'API_001',
    retryable: true,
    userMessage: 'I\'m having trouble responding right now. Please try again in a moment.'
  };

  it('renders nothing when error is null', () => {
    const { container } = render(
      <ErrorToast error={null} onDismiss={jest.fn()} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders ErrorDisplay when error is provided', () => {
    const onDismiss = jest.fn();
    const onRetry = jest.fn();
    
    render(
      <ErrorToast 
        error={mockError} 
        onDismiss={onDismiss} 
        onRetry={onRetry}
      />
    );
    
    expect(screen.getByTestId('snackbar')).toBeInTheDocument();
    expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onDismiss = jest.fn();
    const onRetry = jest.fn();
    
    render(
      <ErrorToast 
        error={mockError} 
        onDismiss={onDismiss} 
        onRetry={onRetry}
      />
    );
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();
    
    render(
      <ErrorToast 
        error={mockError} 
        onDismiss={onDismiss}
      />
    );
    
    const closeButton = screen.getByTestId('snackbar-close');
    fireEvent.click(closeButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});