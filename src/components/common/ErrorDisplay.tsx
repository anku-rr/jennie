'use client';

import React, { useState } from 'react';
import { 
  Alert, 
  Button, 
  Collapse, 
  IconButton, 
  Typography, 
  Box,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { AppError } from '@/lib/errorHandling';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'toast' | 'banner';
  showDetails?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  variant = 'inline',
  showDetails = false,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);

  const getSeverity = () => {
    switch (error.type) {
      case 'network':
      case 'api':
        return 'error';
      case 'webcam':
      case 'emotion':
        return 'warning';
      case 'validation':
        return 'info';
      default:
        return 'error';
    }
  };

  const getIcon = () => {
    const severity = getSeverity();
    switch (severity) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const handleClose = () => {
    setOpen(false);
    onDismiss?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  const renderActions = () => (
    <Box className="flex items-center space-x-2 mt-2">
      {error.retryable && onRetry && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRetry}
          sx={{
            borderColor: getSeverity() === 'error' ? '#ef4444' : '#f59e0b',
            color: getSeverity() === 'error' ? '#ef4444' : '#f59e0b',
            '&:hover': {
              borderColor: getSeverity() === 'error' ? '#dc2626' : '#d97706',
              backgroundColor: getSeverity() === 'error' ? '#fef2f2' : '#fef3c7'
            }
          }}
        >
          Try Again
        </Button>
      )}
      
      {showDetails && error.technicalDetails && (
        <Button
          size="small"
          variant="text"
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setExpanded(!expanded)}
          sx={{ color: '#6b7280' }}
        >
          {expanded ? 'Hide' : 'Show'} Details
        </Button>
      )}
    </Box>
  );

  const renderContent = () => (
    <>
      <Typography variant="body2" className="mb-1">
        {error.userMessage}
      </Typography>
      
      {renderActions()}
      
      {showDetails && error.technicalDetails && (
        <Collapse in={expanded}>
          <Box className="mt-3 p-3 bg-gray-50 rounded text-xs">
            <Typography variant="caption" className="font-medium text-gray-700 block mb-1">
              Technical Details:
            </Typography>
            <pre className="whitespace-pre-wrap text-gray-600 overflow-auto max-h-32">
              {error.technicalDetails}
            </pre>
            {error.code && (
              <Typography variant="caption" className="text-gray-500 block mt-1">
                Error Code: {error.code}
              </Typography>
            )}
          </Box>
        </Collapse>
      )}
    </>
  );

  if (variant === 'toast') {
    return (
      <Snackbar
        open={open}
        autoHideDuration={error.retryable ? null : 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={getSeverity()}
          onClose={handleClose}
          action={
            error.retryable && onRetry ? (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {error.userMessage}
        </Alert>
      </Snackbar>
    );
  }

  if (variant === 'banner') {
    return (
      <Alert
        severity={getSeverity()}
        className={`mb-4 ${className}`}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        {renderContent()}
      </Alert>
    );
  }

  // Default inline variant
  const alertProps: any = {
    severity: getSeverity(),
    className: className,
    icon: getIcon(),
  };
  
  if (onDismiss) {
    alertProps.onClose = (event: React.SyntheticEvent) => onDismiss();
  }

  return (
    <Alert {...alertProps}>
      {renderContent()}
    </Alert>
  );
};

interface ErrorToastProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onRetry,
  onDismiss
}) => {
  if (!error) return null;

  const props: any = {
    error,
    onDismiss,
    variant: "toast"
  };
  
  if (onRetry) {
    props.onRetry = onRetry;
  }

  return <ErrorDisplay {...props} />;
};

export default ErrorDisplay;