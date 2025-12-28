
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Synthesizing high-density storyboard segments...",
  "Generating 35+ cinematic master assets for 60fps production...",
  "Calibrating 1080p high-fidelity visuals...",
  "Drafting massive narrative script for the 22-minute mastercut...",
  "Deep-diving into BDT market trends for Price in BD mode...",
  "Recording steady-pace AI voiceover narration...",
  "Optimizing frame buffer for ultra-smooth 60fps export...",
  "Verifying global facts against current date records...",
  "Drafting deep-dive technical comparisons...",
  "Finalizing master SEO metadata and timestamps...",
  "Almost ready! Wrapping up the high-speed production..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-fade-in">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="space-y-3 max-w-sm">
        <h3 className="text-xl font-bold text-white tracking-tight">Studio Production in Progress</h3>
        <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] h-4">
          {loadingMessages[messageIndex]}
        </p>
        <p className="text-gray-500 text-xs leading-relaxed">
          Generating high-bitrate 60fps assets and deep-dive narrative script. This may take a few moments for 10-22 minute productions.
        </p>
      </div>

      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" 
            style={{ animationDelay: `${i * 0.15}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingIndicator;
