'use client';

import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'dots' | 'pulse';
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'circular',
  className = ''
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 48;
      default: return 32;
    }
  };

  const renderIndicator = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse" />
        );
      
      default:
        return (
          <CircularProgress 
            size={getSizeValue()} 
            sx={{ color: '#3b82f6' }}
          />
        );
    }
  };

  return (
    <Box 
      className={`flex flex-col items-center justify-center p-4 ${className}`}
      role="status"
      aria-label={message}
    >
      {renderIndicator()}
      {message && (
        <Typography 
          variant="body2" 
          className="mt-2 text-gray-600 text-center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'text'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      default:
        return 'rounded-sm';
    }
  };

  return (
    <div
      className={`bg-gray-200 animate-pulse ${getVariantClasses()} ${className}`}
      style={{ width, height }}
      role="presentation"
      aria-hidden="true"
    />
  );
};

export default LoadingIndicator;