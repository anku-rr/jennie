"use client";

import React from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Navbar } from "@/components/common/Navbar";

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: (
        <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      ),
      title: "AI-Powered Conversations",
      description: "Advanced natural language processing enables meaningful, empathetic conversations that adapt to your emotional state and therapeutic needs."
    },
    {
      icon: (
        <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
      ),
      title: "Real-Time Emotion Detection",
      description: "Computer vision technology analyzes facial expressions and voice patterns to understand your emotional state and provide personalized support."
    },
    {
      icon: (
        <svg className="w-12 h-12 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      title: "24/7 Availability",
      description: "Access therapeutic support whenever you need it. No appointments, no waiting lists - just immediate, compassionate care at any time."
    },
    {
      icon: (
        <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      ),
      title: "Personalized Therapy",
      description: "Machine learning algorithms create personalized treatment approaches based on your unique patterns, preferences, and therapeutic goals."
    },
    {
      icon: (
        <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Privacy & Security",
      description: "End-to-end encryption, HIPAA compliance, and local processing ensure your conversations remain completely private and secure."
    },
    {
      icon: (
        <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Evidence-Based Techniques",
      description: "Incorporates proven therapeutic methods like CBT, DBT, and mindfulness practices, backed by clinical research and expert validation."
    }
  ];

  const additionalFeatures = [
    {
      category: "Communication",
      features: [
        "Multi-modal interaction (text, voice, video)",
        "Real-time language translation",
        "Accessibility features for all users",
        "Customizable communication preferences"
      ]
    },
    {
      category: "Analytics & Insights",
      features: [
        "Mood tracking and visualization",
        "Progress reports and insights",
        "Personalized recommendations",
        "Goal setting and achievement tracking"
      ]
    },
    {
      category: "Integration",
      features: [
        "Calendar integration for session reminders",
        "Export session notes and insights",
        "Integration with health apps",
        "Professional referral network"
      ]
    },
    {
      category: "Customization",
      features: [
        "Personalized AI personality",
        "Custom therapy focus areas",
        "Flexible session lengths",
        "Tailored coping strategies"
      ]
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <Navbar currentPage="/features" />

        {/* Hero Section */}
        <div className="text-center py-20 px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Powerful Features for<br />
            Better Mental Health
          </h1>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Discover how Jennie combines cutting-edge AI technology with proven therapeutic methods 
            to provide personalized, accessible mental health support.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300"
              >
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Comprehensive Feature Set
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Every feature is designed to enhance your therapeutic experience and support your mental wellness journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((category, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6 text-center">
                  {category.category}
                </h3>
                <ul className="space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-blue-100">
                      <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Section */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">
                Built on Advanced Technology
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Jennie leverages state-of-the-art AI and machine learning technologies to provide 
                the most effective and personalized therapeutic experience possible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Natural Language Processing</h3>
                <p className="text-blue-100">Advanced NLP models understand context, emotion, and intent in your conversations.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Machine Learning</h3>
                <p className="text-blue-100">Continuous learning algorithms adapt to your unique needs and preferences over time.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Computer Vision</h3>
                <p className="text-blue-100">Facial expression analysis and emotion recognition provide deeper insights into your wellbeing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-20 px-6 border-t border-white/20">
          <h2 className="text-4xl font-bold text-white mb-6">
            Experience the Future of Therapy
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands who have discovered a new way to prioritize their mental health with Jennie's innovative features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/session'}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Try Jennie Free
            </button>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="border border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-700 transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}