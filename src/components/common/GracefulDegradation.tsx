'use client';

import React from 'react';
import { Alert, Button, Box, Typography } from '@mui/material';
import { 
  Warning as WarningIcon,
  Info as InfoIcon,
  Videocam as VideocamIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

interface FeatureUnavailableProps {
  feature: 'webcam' | 'emotion' | 'ai' | 'session';
  reason?: string;
  onRetry?: () => void;
  fallbackContent?: React.ReactNode;
  className?: string;
}

export const FeatureUnavailable: React.FC<FeatureUnavailableProps> = ({
  feature,
  reason,
  onRetry,
  fallbackContent,
  className = ''
}) => {
  const getFeatureInfo = () => {
    switch (feature) {
      case 'webcam':
        return {
          icon: <VideocamIcon />,
          title: 'Camera Unavailable',
          description: 'Camera access is not available, but you can continue chatting with Jennie using text only.',
          severity: 'info' as const
        };
      case 'emotion':
        return {
          icon: <PsychologyIcon />,
          title: 'Emotion Detection Unavailable',
          description: 'Emotion detection is temporarily unavailable, but Jennie can still provide great support through your messages.',
          severity: 'info' as const
        };
      case 'ai':
        return {
          icon: <PsychologyIcon />,
          title: 'AI Service Unavailable',
          description: 'The AI service is temporarily unavailable. Please try again in a moment.',
          severity: 'warning' as const
        };
      case 'session':
        return {
          icon: <WarningIcon />,
          title: 'Session Unavailable',
          description: 'Unable to create or maintain your session. Please refresh the page to try again.',
          severity: 'error' as const
        };
      default:
        return {
          icon: <InfoIcon />,
          title: 'Feature Unavailable',
          description: 'This feature is temporarily unavailable.',
          severity: 'info' as const
        };
    }
  };

  const featureInfo = getFeatureInfo();

  return (
    <Alert
      severity={featureInfo.severity}
      icon={featureInfo.icon}
      className={className}
    >
      <Box>
        <Typography variant="subtitle2" className="font-medium mb-1">
          {featureInfo.title}
        </Typography>
        <Typography variant="body2" className="mb-2">
          {featureInfo.description}
        </Typography>
        {reason && (
          <Typography variant="caption" className="text-gray-600 block mb-2">
            Reason: {reason}
          </Typography>
        )}
        
        {onRetry && (
          <Button
            size="small"
            variant="outlined"
            onClick={onRetry}
            sx={{
              borderColor: featureInfo.severity === 'error' ? '#ef4444' : '#3b82f6',
              color: featureInfo.severity === 'error' ? '#ef4444' : '#3b82f6',
              '&:hover': {
                borderColor: featureInfo.severity === 'error' ? '#dc2626' : '#2563eb',
                backgroundColor: featureInfo.severity === 'error' ? '#fef2f2' : '#eff6ff'
              }
            }}
          >
            Try Again
          </Button>
        )}
        
        {fallbackContent && (
          <Box className="mt-3">
            {fallbackContent}
          </Box>
        )}
      </Box>
    </Alert>
  );
};

interface ProgressiveFallbackProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  condition: boolean;
  feature: FeatureUnavailableProps['feature'];
  reason?: string;
  onRetry?: () => void;
}

export const ProgressiveFallback: React.FC<ProgressiveFallbackProps> = ({
  children,
  fallback,
  condition,
  feature,
  reason,
  onRetry
}) => {
  if (condition) {
    return <>{children}</>;
  }

  const props: any = {
    feature,
    fallbackContent: fallback
  };
  
  if (reason) {
    props.reason = reason;
  }
  
  if (onRetry) {
    props.onRetry = onRetry;
  }

  return <FeatureUnavailable {...props} />;
};

export default FeatureUnavailable;