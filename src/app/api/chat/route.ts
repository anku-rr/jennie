import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse, Message, EmotionData } from "@/types";
import {
  SecureEnvManager,
  InputSanitizer,
  HTTPSEnforcer,
} from "@/lib/security";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Request queue for handling rate limiting
const requestQueue = new Map<
  string,
  Array<{ resolve: Function; reject: Function; request: any }>
>();

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  return_citations?: boolean;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role?: string;
      content?: string;
    };
  }>;
}

// Therapeutic prompt engineering for Jennie's personality
function createSystemPrompt(emotionContext?: EmotionData): string {
  const basePrompt = `You are Jennie, a compassionate and professional AI therapist. Your role is to provide supportive, empathetic, and therapeutic guidance to users seeking mental health support.

Core personality traits:
- Warm, empathetic, and non-judgmental
- Professional yet approachable
- Patient and understanding
- Skilled in active listening and reflection
- Knowledgeable about therapeutic techniques (CBT, mindfulness, etc.)
- Maintains appropriate boundaries while being supportive

Guidelines for responses:
- Always validate the user's feelings and experiences
- Ask thoughtful, open-ended questions to encourage self-reflection
- Provide practical coping strategies when appropriate
- Use therapeutic techniques like reframing, mindfulness, and grounding
- Keep responses conversational but professional
- Avoid giving medical advice or diagnoses
- Encourage professional help when needed
- Be concise but thorough (aim for 2-4 sentences typically)

Remember: You are here to support, not to fix. Guide users toward their own insights and solutions.`;

  if (emotionContext) {
    const emotionPrompt = generateEmotionAwarePrompt(emotionContext);
    return basePrompt + emotionPrompt;
  }

  return (
    basePrompt +
    `

Note: Emotion detection is not currently available, so please rely on the user's words and context to understand their emotional state.`
  );
}

// Generate emotion-specific therapeutic guidance
function generateEmotionAwarePrompt(emotionContext: EmotionData): string {
  const dominantEmotion = emotionContext.dominant;
  const confidence = Math.round(emotionContext.confidence * 100);

  // Get secondary emotions for more nuanced understanding
  const secondaryEmotions = Object.entries(emotionContext.emotions)
    .filter(([emotion, value]) => emotion !== dominantEmotion && value > 0.15)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([emotion, value]) => `${emotion}: ${Math.round(value * 100)}%`);

  let emotionGuidance = "";

  switch (dominantEmotion) {
    case "sad":
      emotionGuidance = `The user appears to be experiencing sadness (${confidence}% confidence). Approach with extra gentleness and validation. Consider offering comfort, acknowledging their pain, and gently exploring what might be contributing to these feelings. Avoid rushing to solutions - sometimes people need to be heard first.`;
      break;

    case "angry":
      emotionGuidance = `The user seems to be feeling anger or frustration (${confidence}% confidence). Validate their feelings without judgment. Help them explore what's underneath the anger - often hurt, disappointment, or feeling unheard. Consider suggesting healthy ways to process these intense emotions.`;
      break;

    case "fearful":
      emotionGuidance = `The user appears anxious or fearful (${confidence}% confidence). Provide reassurance and grounding. Consider offering anxiety management techniques like deep breathing or grounding exercises. Help them identify specific fears and work through them step by step.`;
      break;

    case "happy":
      emotionGuidance = `The user seems to be in a positive emotional state (${confidence}% confidence). While this is wonderful, still be attentive to any underlying concerns they might want to discuss. Positive emotions can be a good foundation for exploring growth and building resilience.`;
      break;

    case "surprised":
      emotionGuidance = `The user appears surprised or startled (${confidence}% confidence). They might be processing unexpected news or experiences. Help them work through whatever has caught them off guard and support them in making sense of new information or situations.`;
      break;

    case "disgusted":
      emotionGuidance = `The user seems to be experiencing disgust or strong aversion (${confidence}% confidence). This might indicate they're dealing with something that conflicts with their values or boundaries. Help them explore these feelings and what they might be telling them about their needs and limits.`;
      break;

    case "neutral":
    default:
      emotionGuidance = `The user appears emotionally neutral (${confidence}% confidence). This could indicate calm, numbness, or emotional regulation. Gently explore how they're truly feeling, as neutral expressions sometimes mask deeper emotions.`;
      break;
  }

  const secondaryEmotionText =
    secondaryEmotions.length > 0
      ? ` I also notice some ${secondaryEmotions.join(
          " and "
        )} in their expression, which suggests a complex emotional state.`
      : "";

  return `

Current emotional context: ${emotionGuidance}${secondaryEmotionText}

Please acknowledge their emotional state naturally in your response, but don't make it the sole focus unless they want to explore it further. Let your therapeutic approach be informed by their emotions while still following their lead in the conversation.`;
}

// Rate limiting check
function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(sessionId);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(sessionId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Queue management for rate-limited requests
async function queueRequest(sessionId: string, request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!requestQueue.has(sessionId)) {
      requestQueue.set(sessionId, []);
    }

    const queue = requestQueue.get(sessionId)!;
    queue.push({ resolve, reject, request });

    // Process queue after a delay
    setTimeout(() => processQueue(sessionId), 1000);
  });
}

async function processQueue(sessionId: string): Promise<void> {
  const queue = requestQueue.get(sessionId);
  if (!queue || queue.length === 0) return;

  if (checkRateLimit(sessionId)) {
    const { resolve, reject, request } = queue.shift()!;
    try {
      const result = await callPerplexityAPI(request);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  // Continue processing queue if items remain
  if (queue.length > 0) {
    setTimeout(() => processQueue(sessionId), 2000);
  }
}

// Retry logic with exponential backoff
async function callPerplexityAPIWithRetry(
  request: PerplexityRequest,
  maxRetries = 3
): Promise<PerplexityResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callPerplexityAPI(request);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes("4")) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Core Perplexity API call
async function callPerplexityAPI(
  request: PerplexityRequest
): Promise<PerplexityResponse> {
  const envManager = SecureEnvManager.getInstance();
  const apiKey = envManager.getSecureEnvVar("PERPLEXITY_API_KEY", true);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Convert conversation history to Perplexity format
function formatConversationHistory(messages: Message[]): PerplexityMessage[] {
  return messages.slice(-10).map((msg) => ({
    role: msg.sender === "user" ? "user" : "assistant",
    content: msg.content,
  }));
}

export async function POST(request: NextRequest) {
  try {
    // Enforce HTTPS in production
    HTTPSEnforcer.enforceHTTPS(request);

    const body: ChatRequest = await request.json();
    const { message, sessionId, emotionContext, conversationHistory } = body;

    // Validate and sanitize inputs
    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: message and sessionId" },
        { status: 400 }
      );
    }

    // Sanitize inputs for security
    const sanitizedMessage = InputSanitizer.sanitizeMessage(message);
    const sanitizedSessionId = InputSanitizer.sanitizeSessionId(sessionId);

    // Check rate limiting using sanitized session ID
    if (!checkRateLimit(sanitizedSessionId)) {
      // Queue the request if rate limited
      try {
        const result = await queueRequest(sanitizedSessionId, {
          ...body,
          message: sanitizedMessage,
          sessionId: sanitizedSessionId,
        });
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json(
          {
            error:
              "Rate limit exceeded. Please wait before sending another message.",
          },
          { status: 429 }
        );
      }
    }

    // Prepare messages for Perplexity API
    const systemPrompt = createSystemPrompt(emotionContext);
    const historyMessages = formatConversationHistory(
      conversationHistory || []
    );

    const perplexityRequest: PerplexityRequest = {
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: sanitizedMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      return_citations: false,
      return_images: false,
      return_related_questions: false,
      presence_penalty: 0.1,
    };

    // Call Perplexity API with retry logic
    const perplexityResponse = await callPerplexityAPIWithRetry(
      perplexityRequest
    );

    const jennieResponse = perplexityResponse.choices[0]?.message?.content;

    if (!jennieResponse) {
      throw new Error("No response received from Perplexity API");
    }

    const response: ChatResponse = {
      response: jennieResponse,
      sessionId: sanitizedSessionId,
      timestamp: new Date().toISOString(),
    };

    // Add security headers to response
    const securityHeaders = HTTPSEnforcer.getSecurityHeaders();
    const nextResponse = NextResponse.json(response);

    Object.entries(securityHeaders).forEach(([key, value]) => {
      nextResponse.headers.set(key, value);
    });

    return nextResponse;
  } catch (error) {
    console.error("Chat API error:", error);

    // Return appropriate error responses
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Service configuration error. Please try again later." },
          { status: 500 }
        );
      }

      if (
        error.message.includes("Rate limit") ||
        error.message.includes("429")
      ) {
        return NextResponse.json(
          {
            error:
              "Too many requests. Please wait a moment before trying again.",
          },
          { status: 429 }
        );
      }

      if (error.message.includes("4")) {
        return NextResponse.json(
          {
            error: "Invalid request. Please check your message and try again.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
