"use client";

import { useState, useEffect } from "react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome to 2048 Onchain!</h2>
          
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">How to Play:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Swipe or use arrow keys to move tiles</li>
                <li>Join tiles with the same number to double them</li>
                <li>Reach 2048 to win!</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Submit your score to compete on the leaderboard</li>
                <li>Track your best score</li>
                <li>Share your achievements with friends</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tip:</strong> Connect your wallet to save your scores and compete globally!
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 min-h-[44px] bg-[#66c800] text-black font-semibold rounded-lg shadow-md hover:bg-[#5ab300] active:scale-95 transition-all"
          >
            Got it, let&apos;s play!
          </button>
        </div>
      </div>
    </div>
  );
}

