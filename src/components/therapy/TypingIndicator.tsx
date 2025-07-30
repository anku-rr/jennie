'use client';

import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-start w-full mb-4">
      <div className="max-w-[70%] sm:max-w-[60%]">
        {/* Sender label */}
        <div className="text-xs text-gray-500 mb-1 text-left">
          Jennie
        </div>
        
        {/* Typing bubble */}
        <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">typing...</span>
          </div>
        </div>
      </div>
    </div>
  );
};