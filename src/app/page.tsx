"use client";

import React from "react";
import { TherapySession } from "@/components/therapy/TherapySession";
import { GuestLogin } from "@/components/auth/GuestLogin";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useSession } from "@/contexts/SessionContext";

export default function Home() {
  const { session } = useSession();

  // Show guest login if no session
  if (!session) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <GuestLogin />
        </div>
      </ErrorBoundary>
    );
  }

  // Show main therapy session
  return (
    <ErrorBoundary>
      <TherapySession />
    </ErrorBoundary>
  );
}
