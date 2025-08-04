"use client";

import React from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Navbar } from "@/components/common/Navbar";

export default function AboutPage() {
  const founders = [
    {
      name: "Akriti",
      role: "Co-Founder & AI Researcher",
      image: "👩‍💻",
      description: "Passionate about leveraging AI to make mental health support accessible to everyone. Akriti brings deep expertise in natural language processing and machine learning to create empathetic AI interactions.",
      expertise: ["AI/ML Research", "Natural Language Processing", "User Experience Design", "Mental Health Technology"]
    },
    {
      name: "Ankur",
      role: "Co-Founder & Technology Lead",
      image: "👨‍💻",
      description: "Dedicated to building scalable, secure platforms that prioritize user privacy and wellbeing. Ankur ensures Jennie's technology infrastructure meets the highest standards of reliability and security.",
      expertise: ["Full-Stack Development", "System Architecture", "Data Security", "Healthcare Compliance"]
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "The Vision",
      description: "Akriti and Ankur recognized the growing mental health crisis and the barriers to accessing traditional therapy - cost, availability, and stigma."
    },
    {
      year: "2024",
      title: "Research & Development",
      description: "Months of research into therapeutic methodologies, AI ethics, and user privacy led to the first prototype of Jennie's conversational AI."
    },
    {
      year: "2024",
      title: "Jennie is Born",
      description: "Named to symbolize our thoughts and vision for accessible mental health support, Jennie represents the culmination of our technical expertise and humanitarian goals."
    },
    {
      year: "2024",
      title: "Launch & Impact",
      description: "Jennie goes live, providing 24/7 mental health support to users worldwide, breaking down barriers to therapeutic care."
    }
  ];

  const values = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      ),
      title: "Empathy First",
      description: "Every interaction with Jennie is designed with genuine care and understanding at its core."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Privacy & Trust",
      description: "Your mental health journey is deeply personal. We protect your privacy with the highest security standards."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      title: "Accessibility",
      description: "Mental health support should be available to everyone, regardless of location, time, or financial situation."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      title: "Innovation",
      description: "We continuously push the boundaries of AI technology to provide better, more personalized mental health support."
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <Navbar currentPage="/about" />

        {/* Hero Section */}
        <div className="text-center py-20 px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About Jennie
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Born from the vision of two passionate technologists, Jennie represents our commitment 
            to making mental health support accessible, empathetic, and available to everyone.
          </p>
          <div className="text-6xl mb-8">🤖💙</div>
        </div>

        {/* Our Story Section */}
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-12 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
              <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                Jennie was born from a simple yet powerful realization: mental health support shouldn't be 
                a luxury. As two technologists who witnessed friends and family struggle to access timely, 
                affordable therapy, <strong className="text-white">Akriti and Ankur</strong> knew they had to act.
              </p>
            </div>
            
            <div className="text-center text-blue-100 text-lg leading-relaxed space-y-6">
              <p>
                "We saw brilliant, caring people suffering in silence because traditional therapy was either 
                too expensive, had months-long waiting lists, or felt too intimidating to start," reflects Akriti.
              </p>
              <p>
                "That's when we realized AI could bridge this gap," adds Ankur. "Not to replace human therapists, 
                but to provide immediate, compassionate support when people need it most."
              </p>
              <p className="text-white font-semibold text-xl">
                Jennie symbolizes our thoughts, our vision, and our unwavering belief that everyone 
                deserves access to mental health support.
              </p>
            </div>
          </div>

          {/* Founders Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-white text-center mb-12">Meet the Founders</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {founders.map((founder, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8"
                >
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{founder.image}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">{founder.name}</h3>
                    <p className="text-blue-200 font-semibold">{founder.role}</p>
                  </div>
                  
                  <p className="text-blue-100 mb-6 leading-relaxed">
                    {founder.description}
                  </p>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-3">Expertise:</h4>
                    <div className="flex flex-wrap gap-2">
                      {founder.expertise.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="bg-white/20 text-white px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-white text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
                >
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm flex-shrink-0">
                    {milestone.year}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                    <p className="text-blue-100 leading-relaxed">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-white text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center"
                >
                  <div className="mb-4 flex justify-center">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                  <p className="text-blue-100 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl border border-white/20 p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-xl text-blue-100 leading-relaxed max-w-4xl mx-auto">
              To democratize mental health support through compassionate AI technology, ensuring that 
              everyone, everywhere, has access to immediate, empathetic, and effective therapeutic guidance. 
              Jennie is more than an AI—she's a symbol of hope, accessibility, and the belief that 
              technology can heal.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-20 px-6 border-t border-white/20">
          <h2 className="text-4xl font-bold text-white mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Be part of the mental health revolution. Experience Jennie and help us make 
            therapeutic support accessible to everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/session'}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Try Jennie Now
            </button>
            <button
              onClick={() => window.location.href = '/features'}
              className="border border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-700 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}