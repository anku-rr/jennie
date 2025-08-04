"use client";

import React from "react";
import { TherapySession } from "@/components/therapy/TherapySession";
import { GuestLogin } from "@/components/auth/GuestLogin";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Navbar } from "@/components/common/Navbar";
import { useSession } from "@/contexts/SessionContext";

export default function SessionPage() {
    const { session } = useSession();

    // Show guest login if no session
    if (!session) {
        return (
            <ErrorBoundary>
                <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                    <Navbar currentPage="/session" showBackToHome={true} />

                    {/* Guest Login Section */}
                    <div className="flex items-center justify-center px-6 py-20">
                        <div className="text-center max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Start Your Therapy Session
                            </h1>
                            <p className="text-xl text-blue-100 mb-12">
                                Create a guest session to begin your conversation with Jennie
                            </p>

                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 inline-block">
                                <GuestLogin />
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }

    // Show therapy session if user has a session
    return (
        <ErrorBoundary>
            <TherapySession />
        </ErrorBoundary>
    );
}