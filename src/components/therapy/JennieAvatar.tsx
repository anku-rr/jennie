'use client';

import React from 'react';
import { Avatar, Paper, Typography } from '@mui/material';
import { Psychology as PsychologyIcon } from '@mui/icons-material';

interface JennieAvatarProps {
  showIntroduction?: boolean;
  className?: string;
}

export const JennieAvatar: React.FC<JennieAvatarProps> = ({
  showIntroduction = true,
  className = ''
}) => {
  return (
    <div className={`jennie-avatar ${className}`}>
      <Paper 
        elevation={2} 
        className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#3b82f6',
              fontSize: '2rem'
            }}
          >
            <PsychologyIcon fontSize="large" />
          </Avatar>

          {/* Introduction */}
          {showIntroduction && (
            <div className="space-y-2">
              <Typography 
                variant="h5" 
                component="h2" 
                className="font-semibold text-gray-800"
              >
                Hi, I&apos;m Jennie
              </Typography>
              
              <Typography 
                variant="body1" 
                className="text-gray-600 max-w-md"
              >
                I&apos;m your AI therapist, here to provide a safe and supportive space 
                for you to share your thoughts and feelings. I&apos;m trained to listen 
                with empathy and offer therapeutic guidance.
              </Typography>
              
              <Typography 
                variant="body2" 
                className="text-gray-500 mt-4"
              >
                How are you feeling today? Feel free to share what&apos;s on your mind.
              </Typography>
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
};

export default JennieAvatar;