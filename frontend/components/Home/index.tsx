"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Lazy load game component
const Game2048 = dynamic(() => import("@/components/games/Game2048"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#eef0f3] dark:bg-gray-900 flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100">2048 Onchain</h1>
        <p className="text-base text-gray-500 dark:text-gray-400">Loading game...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  // Initialize MiniKit frame
  useEffect(() => {
    if (!isFrameReady && setFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Show game immediately, don't wait for context
  // Game can work without MiniKit context (offline mode)
  return <Game2048 />;
}
