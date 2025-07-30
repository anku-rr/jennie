import { POST } from './route';
import { EmotionData, ChatRequest } from '@/types';

// Mock environment variables
process.env.PERPLEXITY_API_KEY = 'test-api-key';

// Mock fetch
global.fetch = jest.fn();

describe('/api/chat with Emotion Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'I understand you are feeling happy. That is wonderful to hear! How has your day been contributing to this positive mood?'
          }
        }]
      })
    });
  });

  const createRequest = (body: ChatRequest) => {
    return {
      json: async () => body,
      method: 'POST',
      headers: {
        get: (name: string) => name === 'content-type' ? 'application/json' : null
      }
    } as unknown as Request;
  };

  const getSystemMessage = () => {
    const fetchCall = (fetch as jest.Mock).mock.calls[0];
    const apiRequestBody = JSON.parse(fetchCall[1].body);
    return apiRequestBody.messages[0];
  };

  it('should include emotion context in system prompt when provided', async () => {
    const emotionContext: EmotionData = {
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
    };

    const requestBody: ChatRequest = {
      message: 'I had a great day today!',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.perplexity.ai/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        })
      })
    );

    // Verify the system prompt includes emotion-specific guidance
    const systemMessage = getSystemMessage();
    
    expect(systemMessage.role).toBe('system');
    expect(systemMessage.content).toContain('positive emotional state');
    expect(systemMessage.content).toContain('80% confidence');
  });

  it('should handle sad emotion with appropriate therapeutic guidance', async () => {
    const emotionContext: EmotionData = {
      dominant: 'sad',
      confidence: 0.7,
      emotions: {
        happy: 0.1,
        sad: 0.7,
        angry: 0.1,
        surprised: 0.02,
        neutral: 0.05,
        fearful: 0.02,
        disgusted: 0.01
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'I am feeling really down today',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('experiencing sadness');
    expect(systemMessage.content).toContain('extra gentleness and validation');
    expect(systemMessage.content).toContain('acknowledging their pain');
  });

  it('should handle angry emotion with appropriate guidance', async () => {
    const emotionContext: EmotionData = {
      dominant: 'angry',
      confidence: 0.9,
      emotions: {
        happy: 0.02,
        sad: 0.05,
        angry: 0.9,
        surprised: 0.01,
        neutral: 0.01,
        fearful: 0.01,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'I am so frustrated with everything!',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('anger or frustration');
    expect(systemMessage.content).toContain('Validate their feelings without judgment');
    expect(systemMessage.content).toContain('what\'s underneath the anger');
  });

  it('should handle fearful emotion with anxiety management guidance', async () => {
    const emotionContext: EmotionData = {
      dominant: 'fearful',
      confidence: 0.85,
      emotions: {
        happy: 0.02,
        sad: 0.08,
        angry: 0.03,
        surprised: 0.02,
        neutral: 0.0,
        fearful: 0.85,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'I am really worried about tomorrow',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('anxious or fearful');
    expect(systemMessage.content).toContain('reassurance and grounding');
    expect(systemMessage.content).toContain('anxiety management techniques');
    expect(systemMessage.content).toContain('deep breathing or grounding exercises');
  });

  it('should include secondary emotions in the prompt', async () => {
    const emotionContext: EmotionData = {
      dominant: 'happy',
      confidence: 0.6,
      emotions: {
        happy: 0.6,
        sad: 0.2,
        angry: 0.16,
        surprised: 0.02,
        neutral: 0.02,
        fearful: 0.01,
        disgusted: 0.0
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'Mixed feelings today',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('sad: 20%');
    expect(systemMessage.content).toContain('angry: 16%');
    expect(systemMessage.content).toContain('complex emotional state');
  });

  it('should work without emotion context and include fallback message', async () => {
    const requestBody: ChatRequest = {
      message: 'Hello Jennie',
      sessionId: 'test-session',
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('Emotion detection is not currently available');
    expect(systemMessage.content).toContain('rely on the user\'s words and context');
  });

  it('should handle neutral emotion appropriately', async () => {
    const emotionContext: EmotionData = {
      dominant: 'neutral',
      confidence: 0.8,
      emotions: {
        happy: 0.1,
        sad: 0.05,
        angry: 0.02,
        surprised: 0.01,
        neutral: 0.8,
        fearful: 0.01,
        disgusted: 0.01
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'Just checking in',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('emotionally neutral');
    expect(systemMessage.content).toContain('calm, numbness, or emotional regulation');
    expect(systemMessage.content).toContain('Gently explore how they\'re truly feeling');
  });

  it('should handle surprised emotion with appropriate guidance', async () => {
    const emotionContext: EmotionData = {
      dominant: 'surprised',
      confidence: 0.75,
      emotions: {
        happy: 0.1,
        sad: 0.05,
        angry: 0.02,
        surprised: 0.75,
        neutral: 0.05,
        fearful: 0.02,
        disgusted: 0.01
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'I cannot believe what just happened!',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('surprised or startled');
    expect(systemMessage.content).toContain('processing unexpected news');
    expect(systemMessage.content).toContain('work through whatever has caught them off guard');
  });

  it('should handle disgusted emotion with values-based guidance', async () => {
    const emotionContext: EmotionData = {
      dominant: 'disgusted',
      confidence: 0.65,
      emotions: {
        happy: 0.02,
        sad: 0.1,
        angry: 0.2,
        surprised: 0.01,
        neutral: 0.02,
        fearful: 0.0,
        disgusted: 0.65
      },
      timestamp: new Date().toISOString()
    };

    const requestBody: ChatRequest = {
      message: 'This situation makes me sick',
      sessionId: 'test-session',
      emotionContext,
      conversationHistory: []
    };

    const request = createRequest(requestBody);
    await POST(request);

    const systemMessage = getSystemMessage();
    
    expect(systemMessage.content).toContain('disgust or strong aversion');
    expect(systemMessage.content).toContain('conflicts with their values or boundaries');
    expect(systemMessage.content).toContain('their needs and limits');
  });
});