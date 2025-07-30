import { ChatRequest, ChatResponse, Message, EmotionData } from '@/types';

export class ChatAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

export interface ChatAPIService {
  sendMessage(
    message: string,
    sessionId: string,
    conversationHistory: Message[],
    emotionContext?: EmotionData
  ): Promise<ChatResponse>;
}

export class PerplexityChatAPI implements ChatAPIService {
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  async sendMessage(
    message: string,
    sessionId: string,
    conversationHistory: Message[],
    emotionContext?: EmotionData
  ): Promise<ChatResponse> {
    return this.sendMessageWithRetry(message, sessionId, conversationHistory, emotionContext, 0);
  }

  private async sendMessageWithRetry(
    message: string,
    sessionId: string,
    conversationHistory: Message[],
    emotionContext: EmotionData | undefined,
    attempt: number
  ): Promise<ChatResponse> {
    const requestBody: ChatRequest = {
      message,
      sessionId,
      conversationHistory,
      ...(emotionContext && { emotionContext })
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Unknown error' };
        }
        
        const isRetryable = response.status >= 500 || response.status === 429;
        throw new ChatAPIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code,
          isRetryable
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ChatAPIError) {
        // Retry logic for retryable errors
        if (error.retryable && attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.sendMessageWithRetry(message, sessionId, conversationHistory, emotionContext, attempt + 1);
        }
        throw error;
      }
      
      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ChatAPIError(
          'Request timed out. Please try again.',
          408,
          'TIMEOUT_ERROR',
          true
        );
      }
      
      // Network or other errors
      const isRetryable = attempt < this.maxRetries;
      const networkError = new ChatAPIError(
        'Failed to connect to the chat service. Please check your connection and try again.',
        0,
        'NETWORK_ERROR',
        isRetryable
      );

      if (isRetryable) {
        const delay = this.baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMessageWithRetry(message, sessionId, conversationHistory, emotionContext, attempt + 1);
      }

      throw networkError;
    }
  }
}

// Default instance
export const chatAPI = new PerplexityChatAPI();