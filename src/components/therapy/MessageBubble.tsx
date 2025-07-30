"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";
  const isJennie = message.sender === "jennie";

  // Format AI responses for better readability
  const formatMessage = (content: string): string => {
    if (!isJennie) return content;

    return (
      content
        // Add line breaks before numbered citations
        .replace(/\[(\d+)\]/g, " [$1]")
        // Add line breaks after sentences that end with citations
        .replace(/(\[\d+\]\.)\s*/g, "$1\n\n")
        // Add line breaks after periods followed by multiple citations
        .replace(/(\.)(\[\d+\]\[\d+\])/g, "$1 $2\n\n")
        // Add line breaks before new sentences that start with capital letters after citations
        .replace(/(\[\d+\])\s+([A-Z])/g, "$1\n\n$2")
        // Clean up multiple consecutive line breaks
        .replace(/\n{3,}/g, "\n\n")
        // Trim whitespace
        .trim()
    );
  };

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? "justify-end" : "justify-start"
      } ${isUser ? "animate-slide-in-right" : "animate-slide-in-left"}`}
    >
      <div
        className={`max-w-[70%] sm:max-w-[60%] ${
          isUser ? "order-2" : "order-1"
        }`}
      >
        {/* Sender label */}
        <div
          className={`text-xs text-gray-500 mb-1 ${
            isUser ? "text-right" : "text-left"
          } animate-fade-in animation-delay-100`}
        >
          {isJennie ? "Jennie" : "You"}
        </div>

        {/* Message bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ease-in-out hover:shadow-md transform hover:scale-[1.02]
            ${
              isUser
                ? "bg-blue-500 text-white rounded-br-md hover:bg-blue-600"
                : "bg-gray-100 text-gray-800 rounded-bl-md hover:bg-gray-200"
            }
          `}
        >
          {isJennie ? (
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {formatMessage(message.content)}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs text-gray-400 mt-1 ${
            isUser ? "text-right" : "text-left"
          } animate-fade-in animation-delay-200`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};
