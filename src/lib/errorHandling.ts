import { WebcamError } from "@/types";

export interface AppError {
  type:
    | "network"
    | "api"
    | "webcam"
    | "emotion"
    | "session"
    | "validation"
    | "unknown";
  message: string;
  code?: string;
  retryable: boolean;
  userMessage: string;
  technicalDetails?: string;
}

export class ErrorHandler {
  static createAppError(
    type: AppError["type"],
    message: string,
    code?: string,
    retryable: boolean = false,
    technicalDetails?: string
  ): AppError {
    const error: any = {
      type,
      message,
      retryable,
      userMessage: this.getUserFriendlyMessage(type, message, code),
    };

    if (code) {
      error.code = code;
    }

    if (technicalDetails) {
      error.technicalDetails = technicalDetails;
    }

    return error;
  }

  static getUserFriendlyMessage(
    type: AppError["type"],
    message: string,
    code?: string
  ): string {
    switch (type) {
      case "network":
        return "Connection issue detected. Please check your internet connection and try again.";

      case "api":
        if (code === "RATE_LIMIT") {
          return "I need a moment to process. Please wait a bit before sending another message.";
        }
        if (code === "TIMEOUT_ERROR") {
          return "The request took too long. Please try again.";
        }
        return "I'm having trouble responding right now. Please try again in a moment.";

      case "webcam":
        return message; // Webcam errors already have user-friendly messages

      case "emotion":
        return "Emotion detection is temporarily unavailable, but you can continue chatting normally.";

      case "session":
        return "Your session has expired. Please refresh the page to continue.";

      case "validation":
        return "Please check your input and try again.";

      default:
        return "Something unexpected happened. Please try again.";
    }
  }

  static fromWebcamError(webcamError: WebcamError): AppError {
    return this.createAppError(
      "webcam",
      webcamError.message,
      webcamError.type,
      webcamError.type !== "permission_denied", // Most webcam errors are retryable except permission denied
      `Webcam error type: ${webcamError.type}`
    );
  }

  static fromChatAPIError(error: any): AppError {
    if (error.name === "ChatAPIError") {
      return this.createAppError(
        "api",
        error.message,
        error.code,
        error.retryable,
        `Status: ${error.status}, Code: ${error.code}`
      );
    }

    return this.createAppError(
      "unknown",
      error.message || "Unknown error occurred",
      undefined,
      false,
      error.stack
    );
  }

  static fromEmotionError(error: any): AppError {
    return this.createAppError(
      "emotion",
      "Emotion detection failed",
      error.code || "EMOTION_ERROR",
      true,
      error.message
    );
  }

  static logError(error: AppError, context?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      type: error.type,
      message: error.message,
      code: error.code,
      context,
      technicalDetails: error.technicalDetails,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("App Error:", logData);
    } else {
      // In production, you might want to send to an error tracking service
      console.error("Error:", error.userMessage);
    }
  }
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class RetryManager {
  private static defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === finalConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay *
            Math.pow(finalConfig.backoffFactor, attempt - 1),
          finalConfig.maxDelay
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
