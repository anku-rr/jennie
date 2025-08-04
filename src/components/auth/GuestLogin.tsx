'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PersonOutline } from '@mui/icons-material';
import { useSession } from '@/contexts/SessionContext';

interface GuestLoginProps {
  onSuccess?: () => void;
}

export function GuestLogin({ onSuccess }: GuestLoginProps) {
  const { createGuestSession, isLoading, error, session } = useSession();

  // Call onSuccess when session is created
  useEffect(() => {
    if (session && onSuccess) {
      onSuccess();
    }
  }, [session, onSuccess]);

  const handleGuestLogin = () => {
    createGuestSession();
  };

  return (
    <Card className="w-full max-w-md shadow-lg bg-white/95 backdrop-blur-sm">
      <CardContent className="p-8">
        <Box className="text-center mb-6">
          <Typography variant="h4" component="h1" className="mb-2 font-bold text-gray-800">
            Welcome to Jennie
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Your AI Therapist
          </Typography>
        </Box>

        <Box className="text-center mb-6">
          <Typography variant="body2" className="text-gray-500 mb-4">
            Start your therapeutic session as a guest. No registration required.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleGuestLogin}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <PersonOutline />}
          className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isLoading ? 'Creating Session...' : 'Continue as Guest'}
        </Button>

        <Box className="mt-6 text-center">
          <Typography variant="caption" className="text-gray-400">
            Your session will be temporary and private
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}