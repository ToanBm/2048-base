"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/hooks/use-theme";

// Lazy load game component
const Game2048 = dynamic(() => import("@/components/games/Game2048"), {
  ssr: false,
});

export default function Home() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { theme, toggleTheme } = useTheme();

  // Initialize MiniKit frame
  useEffect(() => {
    if (!isFrameReady && setFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Show loading state while context is loading
  if (!context) {
    return (
      <div className="bg-[#eef0f3] dark:bg-gray-900 flex min-h-screen flex-col items-center justify-center px-4 pb-4 relative">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
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
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
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
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100">2048 Onchain</h1>
          <p className="text-base text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Auto-connect wallet and show game immediately
  // Wallet connection happens automatically via autoConnect: true in providers
  return <Game2048 />;
}
