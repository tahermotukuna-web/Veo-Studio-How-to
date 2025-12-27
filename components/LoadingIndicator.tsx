
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Deep-diving into the Google knowledge graph...",
  "Synthesizing 10+ segments of in-depth explanation...",
  "Generating photorealistic high-fidelity visuals...",
  "Calibrating cinematic lighting for all scenes...",
  "Verifying facts against current global data...",
  "Drafting a professional educational master script...",
  "Recording high-quality AI voiceover segments...",
  "This is a massive tutorial, it may take 5-10 minutes to render everything...",
  "Almost there! Polishing 1080p photorealistic assets...",
  "Organizing timestamps and SEO metadata...",
  "Ensuring everything feels like original footage...",
  "Wrapping up the final master cut for you..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-2xl border border-gray-700 backdrop-blur-sm animate-fade-in">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-500/10 rounded-full"></div>
        <div className="absolute inset-0 w-24 h-24 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-12 h-12 bg-indigo-500/20 rounded-full animate-pulse"></div>
        </div>
      </div>
      <h2 className="text-2xl font-bold mt-8 text-gray-100 uppercase tracking-widest">Generating Masterclass</h2>
      <p className="mt-4 text-gray-400 text-center transition-opacity duration-500 max-w-sm italic h-16 px-4">
        {loadingMessages[messageIndex]}
      </p>
      <div className="mt-8 flex gap-1">
        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
