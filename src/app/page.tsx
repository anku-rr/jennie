"use client";

import React, { useState } from "react";
import { GuestLogin } from "@/components/auth/GuestLogin";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Navbar } from "@/components/common/Navbar";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showGuestLogin, setShowGuestLogin] = useState(false);
  const router = useRouter();

  // Handle successful login - redirect to therapy session
  const handleLoginSuccess = () => {
    router.push('/session');
  };


  // Always show landing page
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <Navbar 
          currentPage="/" 
          onSignInClick={() => setShowGuestLogin(true)}
          buttonText="Sign In"
        />

        {/* Hero Section */}
        <div className="flex items-center justify-between px-6 py-20 max-w-7xl mx-auto">
          <div className="flex-1 text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Personal AI<br />
              Therapist Awaits
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-md">
              I am always here to hear you
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => handleLoginSuccess()}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
              >
                Start Your Session
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-700 transition-colors flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-blue-200 text-sm">Active Users</div>
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-blue-200 text-sm">Satisfaction Rate</div>
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-blue-200 text-sm">Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Avatar */}
          <div className="hidden lg:flex flex-1 justify-center items-center">
            <div className="relative">
              <div className="w-80 h-80 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-6 py-3 shadow-lg">
                <div className="text-center">
                  <div className="font-bold text-gray-800">Jennie</div>
                  <div className="text-sm text-gray-600">Your AI Therapy Companion</div>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg px-4 py-2 shadow-lg">
                <div className="text-sm text-gray-600">Dedicated.</div>
                <div className="text-sm font-semibold text-gray-800">Optimistic</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
