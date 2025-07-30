import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { EmotionContextProvider, useEmotionContext } from './EmotionContext';
import { EmotionData } from '@/types';

// Test component to access context
const TestComponent = () => {
  const {
    currentEmotion,
    emotionHistory,
    isEmotionDetectionActive,
    updateEmotion,
    clearEmotionHistory,
    setEmotionDetectionActive,
    getRecentEmotionTrend
  } = useEmotionContext();

  const [emotionCounter, setEmotionCounter] = React.useState(0);

  const addVariedEmotion = () => {
    const emotionTypes = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'];
    const emotionType = emotionTypes[emotionCounter % emotionTypes.length];
    const confidence = 0.5 + (emotionCounter * 0.01);
    
    const emotions = {
      happy: 0.1,
      sad: 0.1,
      angry: 0.1,
      surprised: 0.1,
      neutral: 0.1,
      fearful: 0.1,
      disgusted: 0.1
    };
    emotions[emotionType as keyof typeof emotions] = confidence;

    updateEmotion({
      dominant: emotionType as keyof typeof emotions,
      confidence,
      emotions,
      timestamp: new Date(Date.now() + emotionCounter).toISOString()
    });
    
    setEmotionCounter(prev => prev + 1);
  };

  return (
    <div>
      <div data-testid="current-emotion">
        {currentEmotion ? currentEmotion.dominant : 'none'}
      </div>
      <div data-testid="emotion-history-count">
        {emotionHistory.length}
      </div>
      <div data-testid="detection-active">
        {isEmotionDetectionActive ? 'active' : 'inactive'}
      </div>
      <button
        data-testid="update-emotion"
        onClick={() => updateEmotion({
          dominant: 'happy',
          confidence: 0.8,
          emotions: {
            happy: 0.8,
            sad: 0.1,
            angry: 0.05,
            surprised: 0.02,
            neutral: 0.02,
            fearful: 0.01,
            disgusted: 0.0
          },
          timestamp: new Date().toISOString()
        })}
      >
        Update Emotion
      </button>
      <button
        data-testid="add-varied-emotion"
        onClick={addVariedEmotion}
      >
        Add Varied Emotion
      </button>
      <button
        data-testid="clear-history"
        onClick={() => clearEmotionHistory()}
      >
        Clear History
      </button>
      <button
        data-testid="toggle-detection"
        onClick={() => setEmotionDetectionActive(!isEmotionDetectionActive)}
      >
        Toggle Detection
      </button>
      <button
        data-testid="get-trend"
        onClick={() => {
          const trend = getRecentEmotionTrend();
          console.log('Trend:', trend);
        }}
      >
        Get Trend
      </button>
    </div>
  );
};

describe('EmotionContext', () => {
  const renderWithProvider = () => {
    return render(
      <EmotionContextProvider>
        <TestComponent />
      </EmotionContextProvider>
    );
  };

  it('should provide initial state', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('current-emotion')).toHaveTextContent('none');
    expect(screen.getByTestId('emotion-history-count')).toHaveTextContent('0');
    expect(screen.getByTestId('detection-active')).toHaveTextContent('inactive');
  });

  it('should update current emotion and add to history', () => {
    renderWithProvider();
    
    act(() => {
      screen.getByTestId('update-emotion').click();
    });

    expect(screen.getByTestId('current-emotion')).toHaveTextContent('happy');
    expect(screen.getByTestId('emotion-history-count')).toHaveTextContent('1');
  });

  it('should clear emotion history and current emotion', () => {
    renderWithProvider();
    
    // Add an emotion first
    act(() => {
      screen.getByTestId('update-emotion').click();
    });

    expect(screen.getByTestId('emotion-history-count')).toHaveTextContent('1');

    // Clear history
    act(() => {
      screen.getByTestId('clear-history').click();
    });

    expect(screen.getByTestId('current-emotion')).toHaveTextContent('none');
    expect(screen.getByTestId('emotion-history-count')).toHaveTextContent('0');
  });

  it('should toggle emotion detection active state', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('detection-active')).toHaveTextContent('inactive');

    act(() => {
      screen.getByTestId('toggle-detection').click();
    });

    expect(screen.getByTestId('detection-active')).toHaveTextContent('active');

    act(() => {
      screen.getByTestId('toggle-detection').click();
    });

    expect(screen.getByTestId('detection-active')).toHaveTextContent('inactive');
  });

  it('should clear current emotion when deactivating detection', () => {
    renderWithProvider();
    
    // Add emotion and activate detection
    act(() => {
      screen.getByTestId('update-emotion').click();
      screen.getByTestId('toggle-detection').click();
    });

    expect(screen.getByTestId('current-emotion')).toHaveTextContent('happy');
    expect(screen.getByTestId('detection-active')).toHaveTextContent('active');

    // Deactivate detection
    act(() => {
      screen.getByTestId('toggle-detection').click();
    });

    expect(screen.getByTestId('current-emotion')).toHaveTextContent('none');
    expect(screen.getByTestId('detection-active')).toHaveTextContent('inactive');
  });

  it('should maintain emotion history limit', () => {
    renderWithProvider();
    
    // Add more than MAX_EMOTION_HISTORY emotions with varied types and confidence
    act(() => {
      for (let i = 0; i < 55; i++) {
        screen.getByTestId('add-varied-emotion').click();
      }
    });

    // Should be limited to 50
    expect(screen.getByTestId('emotion-history-count')).toHaveTextContent('50');
  });

  it('should calculate recent emotion trend', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderWithProvider();
    
    // Add multiple emotions
    act(() => {
      screen.getByTestId('update-emotion').click();
    });

    // Wait a bit to ensure the emotion is in history
    act(() => {
      screen.getByTestId('get-trend').click();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Trend:', expect.objectContaining({
      dominant: 'happy',
      confidence: expect.any(Number),
      emotions: expect.any(Object),
      timestamp: expect.any(String)
    }));

    consoleSpy.mockRestore();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useEmotionContext must be used within an EmotionContextProvider');

    consoleSpy.mockRestore();
  });
});