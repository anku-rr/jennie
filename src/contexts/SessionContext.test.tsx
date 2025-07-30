import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider, useSession } from "./SessionContext";
import { Session } from "@/types";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";

// Test component to access the context
const TestComponent = () => {
  const { session, isLoading, error, createGuestSession, clearSession } =
    useSession();

  return (
    <div>
      <div data-testid="session-id">{session?.id || "No session"}</div>
      <div data-testid="loading">{isLoading ? "Loading" : "Not loading"}</div>
      <div data-testid="error">{error || "No error"}</div>
      <button onClick={createGuestSession} data-testid="create-session">
        Create Session
      </button>
      <button onClick={clearSession} data-testid="clear-session">
        Clear Session
      </button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <SessionProvider>
      <TestComponent />
    </SessionProvider>
  );
};

describe("SessionContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.localStorage.clear as jest.Mock).mockClear();
    (window.localStorage.getItem as jest.Mock).mockClear();
    (window.localStorage.setItem as jest.Mock).mockClear();
    (window.localStorage.removeItem as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  it("should provide initial state with no session", () => {
    renderWithProvider();

    expect(screen.getByTestId("session-id")).toHaveTextContent("No session");
    expect(screen.getByTestId("loading")).toHaveTextContent("Not loading");
    expect(screen.getByTestId("error")).toHaveTextContent("No error");
  });

  it("should create a guest session successfully", async () => {
    const mockResponse = {
      sessionId: "guest_123_abc",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProvider();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByTestId("create-session"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("session-id")).toHaveTextContent(
        "guest_123_abc"
      );
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("Not loading");
    expect(screen.getByTestId("error")).toHaveTextContent("No error");
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "therapist_session",
      expect.stringContaining("guest_123_abc")
    );
  });

  it("should handle session creation failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderWithProvider();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByTestId("create-session"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to create session"
      );
    });

    expect(screen.getByTestId("session-id")).toHaveTextContent("No session");
    expect(screen.getByTestId("loading")).toHaveTextContent("Not loading");
  });

  it("should show loading state during session creation", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(promise);

    renderWithProvider();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByTestId("create-session"));
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("Loading");

    // Resolve the promise
    act(() => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          sessionId: "guest_123_abc",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("Not loading");
    });
  });

  it("should clear session", async () => {
    const mockResponse = {
      sessionId: "guest_123_abc",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProvider();
    const user = userEvent.setup();

    // Create session first
    await act(async () => {
      await user.click(screen.getByTestId("create-session"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("session-id")).toHaveTextContent(
        "guest_123_abc"
      );
    });

    // Clear session
    await act(async () => {
      await user.click(screen.getByTestId("clear-session"));
    });

    expect(screen.getByTestId("session-id")).toHaveTextContent("No session");
    expect(screen.getByTestId("error")).toHaveTextContent("No error");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      "therapist_session"
    );
  });

  it("should restore valid session from localStorage on mount", () => {
    const validSession: Session = {
      id: "guest_stored_123",
      type: "guest",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      conversationHistory: [],
    };

    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(validSession)
    );

    renderWithProvider();

    expect(screen.getByTestId("session-id")).toHaveTextContent(
      "guest_stored_123"
    );
  });

  it("should clear expired session from localStorage on mount", () => {
    const expiredSession: Session = {
      id: "guest_expired_123",
      type: "guest",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      conversationHistory: [],
    };

    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(expiredSession)
    );

    renderWithProvider();

    expect(screen.getByTestId("session-id")).toHaveTextContent("No session");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      "therapist_session"
    );
  });

  it("should handle malformed session data in localStorage", () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue("invalid json");

    renderWithProvider();

    expect(screen.getByTestId("session-id")).toHaveTextContent("No session");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      "therapist_session"
    );
  });

  it("should throw error when useSession is used outside provider", () => {
    const TestComponentWithoutProvider = () => {
      useSession();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      "useSession must be used within a SessionProvider"
    );
  });
});
