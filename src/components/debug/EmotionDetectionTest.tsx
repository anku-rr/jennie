"use client";

import React, { useRef, useEffect, useState } from 'react';
import { EmotionData } from '@/types';
import { loadEmotionModels, loadEmotionModelsSimple, detectEmotions, areModelsLoaded } from '@/utils/emotionDetection';

export const EmotionDetectionTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [emotion, setEmotion] = useState<EmotionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Initialize models
  useEffect(() => {
    const initModels = async () => {
      try {
        console.log('[EmotionTest] Loading models with simple approach...');
        await loadEmotionModelsSimple();
        setModelsLoaded(true);
        console.log('[EmotionTest] Models loaded successfully');
      } catch (err) {
        console.error('[EmotionTest] Simple model loading failed, trying complex approach:', err);
        try {
          await loadEmotionModels();
          setModelsLoaded(true);
          console.log('[EmotionTest] Models loaded with complex approach');
        } catch (err2) {
          console.error('[EmotionTest] Both loading approaches failed:', err2);
          setError(`Model loading failed: ${err2 instanceof Error ? err2.message : 'Unknown error'}`);
        }
      }
    };

    initModels();
  }, []);

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        console.log('[EmotionTest] Starting webcam...');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          console.log('[EmotionTest] Webcam started successfully');
        }
      } catch (err) {
        console.error('[EmotionTest] Webcam failed:', err);
        setError(`Webcam failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start emotion detection
  const startDetection = async () => {
    if (!videoRef.current || !modelsLoaded || !stream) {
      console.warn('[EmotionTest] Cannot start detection - missing requirements');
      return;
    }

    setIsDetecting(true);
    setError(null);

    const detectLoop = async () => {
      try {
        console.log('[EmotionTest] Attempting emotion detection...');
        console.log('[EmotionTest] Video element state:', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          readyState: videoRef.current?.readyState,
          currentTime: videoRef.current?.currentTime,
          paused: videoRef.current?.paused
        });

        const result = await detectEmotions(videoRef.current!);
        
        if (result) {
          console.log('[EmotionTest] Emotion detected:', result);
          setEmotion(result);
        } else {
          console.log('[EmotionTest] No face detected');
        }
      } catch (err) {
        console.error('[EmotionTest] Detection error:', err);
        setError(`Detection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      if (isDetecting) {
        setTimeout(detectLoop, 1000); // Detect every second
      }
    };

    detectLoop();
  };

  const stopDetection = () => {
    setIsDetecting(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Emotion Detection Test</h2>
      
      {/* Video */}
      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={320}
          height={240}
          className="border rounded"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* Status */}
      <div className="mb-4 space-y-2">
        <div>Models Loaded: <span className={modelsLoaded ? 'text-green-600' : 'text-red-600'}>{modelsLoaded ? 'Yes' : 'No'}</span></div>
        <div>Webcam: <span className={stream ? 'text-green-600' : 'text-red-600'}>{stream ? 'Active' : 'Inactive'}</span></div>
        <div>Detection: <span className={isDetecting ? 'text-blue-600' : 'text-gray-600'}>{isDetecting ? 'Running' : 'Stopped'}</span></div>
      </div>

      {/* Controls */}
      <div className="mb-4 space-x-2">
        <button
          onClick={startDetection}
          disabled={!modelsLoaded || !stream || isDetecting}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Start Detection
        </button>
        <button
          onClick={stopDetection}
          disabled={!isDetecting}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Stop Detection
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Emotion Result */}
      {emotion && (
        <div className="p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-bold mb-2">Current Emotion:</h3>
          <div>Dominant: <strong>{emotion.dominant}</strong></div>
          <div>Confidence: <strong>{(emotion.confidence * 100).toFixed(1)}%</strong></div>
          <div className="mt-2">
            <h4 className="font-semibold">All Emotions:</h4>
            {Object.entries(emotion.emotions).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span>{(value * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <h4 className="font-semibold mb-2">Debug Info:</h4>
        <div>Models Loaded Check: {areModelsLoaded() ? 'True' : 'False'}</div>
        <div>Video Ready State: {videoRef.current?.readyState || 'N/A'}</div>
        <div>Video Dimensions: {videoRef.current?.videoWidth || 0} x {videoRef.current?.videoHeight || 0}</div>
        <div>Current Time: {videoRef.current?.currentTime || 0}</div>
        <div>Face-API Available: {typeof window !== 'undefined' && (window as any).faceapi ? 'True' : 'False'}</div>
      </div>

      {/* Model File Test */}
      <div className="mt-4">
        <button
          onClick={async () => {
            console.log('Testing model file access...');
            try {
              const response1 = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
              const response2 = await fetch('/models/face_expression_model-weights_manifest.json');
              console.log('Model files accessible:', {
                tinyFaceDetector: response1.ok,
                faceExpression: response2.ok
              });
              if (response1.ok) {
                const manifest1 = await response1.json();
                console.log('TinyFaceDetector manifest:', manifest1);
              }
              if (response2.ok) {
                const manifest2 = await response2.json();
                console.log('FaceExpression manifest:', manifest2);
              }
            } catch (err) {
              console.error('Model file test failed:', err);
            }
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Test Model Files
        </button>
      </div>
    </div>
  );
};