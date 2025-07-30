"use client";

import React from 'react';
import { EmotionDetectionTest } from '@/components/debug/EmotionDetectionTest';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Debug Tools</h1>
        <EmotionDetectionTest />
      </div>
    </div>
  );
}