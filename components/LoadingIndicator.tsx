
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Consulting the Google knowledge graph...",
  "Researching the latest tutorial steps...",
  "Fact-checking the process...",
  "Drafting a professional script...",
  "Finding the best way to explain this...",
  "Generating cinematic visuals...",
  "Recording AI voiceover talent...",
  "Polishing the master cut...",
  "Warming up the digital director...",
  "Applying cinematic lighting...",
  "This can take a few minutes, hang tight!",
  "Adding a touch of movie magic...",
  "Don't worry, the pixels are friendly.",
  "Starting a draft for your Oscar speech..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-2xl border border-gray-700 backdrop-blur-sm">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-semibold mt-8 text-gray-200">Creating Your Tutorial</h2>
      <p className="mt-2 text-gray-400 text-center transition-opacity duration-500 max-w-xs h-12">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;
