"use client";

import React, { useState, useEffect } from 'react';
import { getEmotionDebugInfo, EmotionDebugInfo } from '@/utils/emotionDebug';

interface EmotionDebugPanelProps {
  isVisible?: boolean;
  className?: string;
}

export const EmotionDebugPanel: React.FC<EmotionDebugPanelProps> = ({
  isVisible = true,
  className = '',
}) => {
  const [debugInfo, setDebugInfo] = useState<EmotionDebugInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateDebugInfo = () => {
      setDebugInfo(getEmotionDebugInfo());
    };

    // Update debug info every 500ms
    const interval = setInterval(updateDebugInfo, 500);
    updateDebugInfo(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !debugInfo) {
    return null;
  }

  const getStatusColor = (status: boolean) => status ? 'text-green-400' : 'text-red-400';
  const getStatusIcon = (status: boolean) => status ? '✓' : '✗';

  return (
    <div className={`fixed top-4 right-4 bg-black bg-opacity-90 text-white text-xs font-mono rounded-lg shadow-lg z-50 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer border-b border-gray-600"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold">Emotion Debug</span>
        <div className="flex items-center space-x-2">
          <span className={getStatusColor(debugInfo.isVideoReady)}>
            {getStatusIcon(debugInfo.isVideoReady)} Video
          </span>
          <span className={getStatusColor(debugInfo.modelsLoaded)}>
            {getStatusIcon(debugInfo.modelsLoaded)} Models
          </span>
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {/* Video Status */}
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">Video Status</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Connected: <span className={getStatusColor(debugInfo.videoStatus.isConnected)}>{getStatusIcon(debugInfo.videoStatus.isConnected)}</span></div>
              <div>Playing: <span className={getStatusColor(debugInfo.videoStatus.isPlaying)}>{getStatusIcon(debugInfo.videoStatus.isPlaying)}</span></div>
              <div>Dimensions: <span className="text-yellow-300">{debugInfo.videoStatus.videoWidth}x{debugInfo.videoStatus.videoHeight}</span></div>
              <div>Ready State: <span className="text-yellow-300">{debugInfo.videoStatus.readyState}</span></div>
              <div>Current Time: <span className="text-yellow-300">{debugInfo.videoStatus.currentTime.toFixed(2)}s</span></div>
              <div>Paused: <span className={getStatusColor(!debugInfo.videoStatus.paused)}>{getStatusIcon(!debugInfo.videoStatus.paused)}</span></div>
            </div>
            {debugInfo.videoStatus.error && (
              <div className="text-red-400 mt-1">Error: {debugInfo.videoStatus.error}</div>
            )}
          </div>

          {/* Model Status */}
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">Model Status</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Face Detector: <span className={getStatusColor(debugInfo.modelStatus.tinyFaceDetector)}>{getStatusIcon(debugInfo.modelStatus.tinyFaceDetector)}</span></div>
              <div>Expression Net: <span className={getStatusColor(debugInfo.modelStatus.faceExpressionNet)}>{getStatusIcon(debugInfo.modelStatus.faceExpressionNet)}</span></div>
              <div>Loading: <span className={getStatusColor(!debugInfo.modelStatus.isLoading)}>{getStatusIcon(!debugInfo.modelStatus.isLoading)}</span></div>
              {debugInfo.modelStatus.loadingDuration && (
                <div>Load Time: <span className="text-yellow-300">{debugInfo.modelStatus.loadingDuration}ms</span></div>
              )}
            </div>
            {debugInfo.modelStatus.lastError && (
              <div className="text-red-400 mt-1">Error: {debugInfo.modelStatus.lastError}</div>
            )}
          </div>

          {/* Detection Stats */}
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">Detection Stats</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Total: <span className="text-yellow-300">{debugInfo.detectionCount}</span></div>
              <div>Successful: <span className="text-green-400">{debugInfo.successfulDetections}</span></div>
              <div>Failed: <span className="text-red-400">{debugInfo.failedDetections}</span></div>
              <div>Success Rate: <span className="text-yellow-300">
                {debugInfo.detectionCount > 0 ? ((debugInfo.successfulDetections / debugInfo.detectionCount) * 100).toFixed(1) : 0}%
              </span></div>
              <div>Avg Time: <span className="text-yellow-300">{debugInfo.averageProcessingTime.toFixed(1)}ms</span></div>
              <div>Last Detection: <span className="text-yellow-300">
                {debugInfo.lastDetectionTime ? new Date(debugInfo.lastDetectionTime).toLocaleTimeString() : 'Never'}
              </span></div>
            </div>
          </div>

          {/* Current Emotion */}
          {debugInfo.lastEmotionData && (
            <div>
              <h4 className="font-semibold text-blue-300 mb-1">Current Emotion</h4>
              <div className="text-xs">
                <div>Dominant: <span className="text-green-300 font-semibold">{debugInfo.lastEmotionData.dominant}</span></div>
                <div>Confidence: <span className="text-yellow-300">{(debugInfo.lastEmotionData.confidence * 100).toFixed(1)}%</span></div>
                <div className="mt-1">
                  <div className="text-gray-400">All Emotions:</div>
                  {Object.entries(debugInfo.lastEmotionData.emotions).map(([emotion, value]) => (
                    <div key={emotion} className="flex justify-between">
                      <span>{emotion}:</span>
                      <span className="text-yellow-300">{(value * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">Performance</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>FPS: <span className="text-yellow-300">{debugInfo.performanceMetrics.fps.toFixed(1)}</span></div>
              <div>CPU Usage: <span className="text-yellow-300">{debugInfo.performanceMetrics.avgCpuUsage.toFixed(1)}%</span></div>
              <div>Frame Drops: <span className="text-yellow-300">{(debugInfo.performanceMetrics.frameDropRate * 100).toFixed(1)}%</span></div>
              <div>Memory: <span className="text-yellow-300">{debugInfo.performanceMetrics.memoryUsage.toFixed(1)}MB</span></div>
            </div>
          </div>

          {/* API Status */}
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">API Integration</h4>
            <div className="text-xs">
              <div>Context Sent: <span className={getStatusColor(debugInfo.apiContextSent)}>{getStatusIcon(debugInfo.apiContextSent)}</span></div>
            </div>
          </div>

          {/* Recent Errors */}
          {debugInfo.detectionErrors.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-300 mb-1">Recent Errors</h4>
              <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                {debugInfo.detectionErrors.slice(-3).map((error, index) => (
                  <div key={index} className="text-red-400 break-words">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmotionDebugPanel;