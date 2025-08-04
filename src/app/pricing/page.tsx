"use client";

import React from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Navbar } from "@/components/common/Navbar";

export default function PricingPage() {
    const pricingPlans = [
        {
            name: "Guest",
            price: "Free",
            period: "",
            description: "Try Jennie with limited sessions",
            features: [
                "3 sessions per month",
                "Basic emotion detection",
                "Text-based conversations",
                "Session history (7 days)",
                "Community support"
            ],
            buttonText: "Start Free Trial",
            buttonStyle: "border border-white text-white hover:bg-white hover:text-blue-700",
            popular: false
        },
        {
            name: "Personal",
            price: "$19",
            period: "/month",
            description: "Perfect for regular therapy sessions",
            features: [
                "Unlimited sessions",
                "Advanced emotion detection",
                "Voice & video support",
                "Session history (90 days)",
                "Personalized insights",
                "Priority support",
                "Export session notes"
            ],
            buttonText: "Get Started",
            buttonStyle: "bg-green-500 hover:bg-green-600 text-white",
            popular: true
        },
        {
            name: "Professional",
            price: "$49",
            period: "/month",
            description: "For therapists and healthcare providers",
            features: [
                "Everything in Personal",
                "Multiple client profiles",
                "Professional analytics",
                "HIPAA compliance",
                "Custom branding",
                "API access",
                "Dedicated support",
                "Team collaboration tools"
            ],
            buttonText: "Contact Sales",
            buttonStyle: "border border-white text-white hover:bg-white hover:text-blue-700",
            popular: false
        }
    ];

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                <Navbar currentPage="/pricing" />

                {/* Hero Section */}
                <div className="text-center py-20 px-6">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                        Affordable AI therapy that fits your needs. Start free and upgrade anytime.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-6xl mx-auto px-6 pb-20">
                    <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 ${plan.popular ? 'ring-2 ring-green-400' : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                                        <span className="text-blue-200">{plan.period}</span>
                                    </div>
                                    <p className="text-blue-100">{plan.description}</p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center text-white">
                                            <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        if (plan.name === "Guest") {
                                            window.location.href = '/session';
                                        } else if (plan.name === "Professional") {
                                            window.location.href = 'mailto:sales@jennie-ai.com';
                                        } else {
                                            // Handle subscription logic here
                                            alert(`Redirecting to ${plan.name} plan signup...`);
                                        }
                                    }}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${plan.buttonStyle}`}
                                >
                                    {plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto px-6 pb-20">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Is my data secure and private?
                            </h3>
                            <p className="text-blue-100">
                                Yes, absolutely. All conversations are encrypted end-to-end, and we follow strict privacy protocols.
                                Your data is never shared with third parties, and you can delete your sessions at any time.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Can I cancel my subscription anytime?
                            </h3>
                            <p className="text-blue-100">
                                Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.
                                You'll continue to have access until the end of your billing period.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">
                                How does the free trial work?
                            </h3>
                            <p className="text-blue-100">
                                The Guest plan gives you 3 free sessions per month to try Jennie. No credit card required.
                                You can upgrade to unlimited sessions anytime.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Is this a replacement for human therapy?
                            </h3>
                            <p className="text-blue-100">
                                Jennie is designed to complement, not replace, human therapy. While AI can provide 24/7 support
                                and coping strategies, we always recommend consulting with licensed professionals for serious mental health concerns.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center py-20 px-6 border-t border-white/20">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to start your journey?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands who have found support and guidance with Jennie
                    </p>
                    <button
                        onClick={() => window.location.href = '/session'}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                    >
                        Start Free Today
                    </button>
                </div>
            </div>
        </ErrorBoundary>
    );
}