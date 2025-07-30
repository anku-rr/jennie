'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Paper, Typography, Box } from '@mui/material';
import { Refresh as RefreshIcon, BugReport as BugReportIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <Paper elevation={3} className="max-w-md w-full p-6">
            <div className="text-center mb-4">
              <BugReportIcon 
                sx={{ fontSize: 48, color: '#ef4444' }} 
                className="mb-2"
              />
              <Typography variant="h5" className="font-semibold text-gray-800 mb-2">
                Something went wrong
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                We encountered an unexpected error. This has been logged and we&apos;ll work to fix it.
              </Typography>
            </div>

            <Alert severity="error" className="mb-4">
              <Typography variant="body2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
            </Alert>

            <Box className="space-y-2">
              <Button
                fullWidth
                variant="contained"
                onClick={this.handleReset}
                startIcon={<RefreshIcon />}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  }
                }}
              >
                Try Again
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={this.handleReload}
                className="text-gray-600 border-gray-300"
              >
                Reload Page
              </Button>
            </Box>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap text-gray-600 overflow-auto max-h-32">
                  {this.state.error?.stack}
                </pre>
                <pre className="whitespace-pre-wrap text-gray-600 overflow-auto max-h-32 mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Paper>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;